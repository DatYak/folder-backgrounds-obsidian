import { App, DataAdapter, Editor, FileSystemAdapter, FileView, HoverPopover, MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf, WorkspaceWindow } from 'obsidian';
import { SourcebookBackgroundPluginSettings } from './common';
import { SourceBGSettingTab } from './settings';
import * as path from 'path';

const DEFAULT_SETTINGS: SourcebookBackgroundPluginSettings = {

	SourceFolders: [
    ],
    NoteBG: [
    ],
    DefaultBG: ""
} 

export default class SourcebookBGPlugin extends Plugin {
	
	settings: SourcebookBackgroundPluginSettings;
	popoverObserver: MutationObserver;

	async onload() {
		console.log("loading sourcebook background plugin...");
		
		await this.loadSettings();
		
   		this.addSettingTab(new SourceBGSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => this.SetSourcebookBackgroundContainerBgProperty())
		);

		this.registerMarkdownPostProcessor((element, context) => {
			const isHoverPopover = context.containerEl.closest('.hover-popover');
			if (isHoverPopover)
			{
				//console.log("Popover Markdown")
				context.containerEl.closest('.hover-popover')?.setAttribute("data-hover-file-path", context.sourcePath);
			}
			
		});


		this.registerEvent(
			this.app.metadataCache.on('changed', async (file) => this.GetImagePath(file.path))
		);

		this.popoverObserver = new MutationObserver((mutations) =>{
			for (const mutation of mutations) {
				mutation.addedNodes.forEach(node => {
					if (node instanceof HTMLElement && node.classList.contains('hover-popover')) {
						setTimeout(() => {
							this.SetPopoverBG(node);			
						}, 50);	
					}
				});
			}
		});

		this.popoverObserver.observe(document.body, { childList: true, subtree: true });
	}

	onunload() {
		console.log("unloading sourcebook background plugin...");
		this.popoverObserver.disconnect()
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	SetSourcebookBackgroundContainerBgProperty(){
		console.log("Changing BGs");
		this.app.workspace.iterateAllLeaves((leaf) =>
		{
			this.SetSourcebookBG(leaf)
		})
	}

	GetImagePath(path:string)
	{
		// if (this.app.vault.adapter instanceof FileSystemAdapter) {
		// 	const absolutePath = this.app.vault.adapter.getFullPath(path);
		// 	console.log("Absolute Path: " + absolutePath)

		// }
		
		//console.log("Path: " + path	)
		for (let index = 0; index < this.settings.SourceFolders.length; index++) {
			if (path.contains(this.settings.SourceFolders[index]))
			{
				return this.settings.NoteBG[index];
			}
		}	
		
		return this.settings.DefaultBG;
	}


	SetSourcebookBG(leaf: WorkspaceLeaf){

		let activeFile = (leaf.view as FileView).file
		
		if (activeFile === null)
		{
			return;
		}

		if (activeFile?.path != null)
		{
			
			let bgImage = this.GetImagePath(activeFile.path)
			//console.log("Leaf is Page")
			this.SetPageBG(leaf, bgImage);
		
		}
	}

	SetPageBG(leaf: WorkspaceLeaf, bgImage: string)
	{
		//console.log("Styling Page!")
		let leafView = leaf.view.containerEl

		const dataType = leafView.getAttribute("data-type")
		if (dataType != "markdown") return;

		//console.log(bgImage)
		let bg = leafView.find(".view-content")
		if (bg)
		{
			bg.style.setProperty("background","url(\"" + bgImage + "\"");
			bg.style.setProperty("background-size", "cover");
			bg.style.setProperty("background-position", "center center");
		}

		
		let backgroundColor = '#000000ff';

		const bodyEl = document.querySelector('body')
		if (bodyEl)
		{
			const computedStyle = getComputedStyle(bodyEl);
			backgroundColor = computedStyle.getPropertyValue('--background-primary');
		}
		else
		{
			console.log("No body element found");
		}

		let content  = leafView.find(".cm-contentContainer")
		if (content)
		{
			content.style.setProperty("background-color", backgroundColor)
			content.style.setProperty("padding", "1%")
			content.style.setProperty("border-radius", "12px")
		}

		let preview = leafView.find(".markdown-preview-sizer.markdown-preview-section")
		if (preview)
		{
			preview.style.setProperty("background-color", backgroundColor)
			preview.style.setProperty("padding", "1%")
			preview.style.setProperty("border-radius", "12px")
		}
	}

	SetPopoverBG(node:HTMLElement)
	{

		if (node.firstElementChild?.classList.contains("image-embed"))
		{
			//console.log("found image")
			return;
		}

		let backgroundColor = '#000000';

		const bodyEl = document.querySelector('body')
		if (bodyEl)
		{
			const computedStyle = getComputedStyle(bodyEl);
			backgroundColor = computedStyle.getPropertyValue('--background-primary');
		}
		else
		{
			console.log("No body element found");
		}

		let filePath = node.getAttribute("data-hover-file-path") ?? " ";
		let bgImage = this.GetImagePath(filePath)

		const banner = document.createElement("div");
        banner.classList.add("hover-banner");
		banner.style.setProperty("background","url(\"" + bgImage + "\"");
		banner.style.setProperty("background-size", "cover")

		const firstChild = node.firstElementChild;
		if (firstChild) {
			const newParent = banner
			node.insertBefore(banner, firstChild);
			newParent.appendChild(firstChild);

			let page = firstChild.find(".markdown-preview-view.markdown-rendered") as HTMLElement
			
			if (!page) return;

			page.style.setProperty("box-sizing", "border-box")
			page.style.setProperty("padding", "1%", 'important')
			page.style.setProperty("border-radius", "12px")
			page.style.setProperty("overflow-y", "scroll")
			///page.style.setProperty("background-color", "#202020")
			page.style.setProperty("background-color", backgroundColor)
			Object.assign(page.style, {
					overflow: 'auto',
					maxHeight: '400px',
			});

			let pageParent = page.parentElement?.style;
			if (pageParent)
				pageParent.setProperty("padding", "0px", "important");
			
			(firstChild as HTMLElement)?.style.setProperty("padding", "2.5%", 'important')

		}
	}
}