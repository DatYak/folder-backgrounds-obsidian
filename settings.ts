import { text } from 'stream/consumers';
import SourcebookBGPlugin from './main';
import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';

export class SourceBGSettingTab extends PluginSettingTab {
  plugin: SourcebookBGPlugin;

  constructor(app: App, plugin: SourcebookBGPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();

    const recordEl= containerEl.createEl('div', {cls: "folder-entry-parent"})
    new Setting(recordEl)
    .setName("Default Banner")
    .addText((text)=> text
        .setValue(this.plugin.settings.DefaultBG)
        .onChange(async (value) => {
          this.plugin.settings.DefaultBG = value;
          await this.plugin.saveSettings();
    }))

    new ButtonComponent(containerEl)
    .onClick(async  (event) => {
        await this.AddRecord()
        })
    .buttonEl.setText("Add Record");

    this.plugin.settings.SourceFolders.forEach((source, index) => {
        const recordEl = containerEl.createEl('div', {cls: "folder-entry-parent"})
        new Setting(recordEl)
        .setClass("wide-text-entry")
        .setName("Source Folder Path")
        .addText((text)=> text
            .setValue(source)
            .onChange(async (value) =>{
                this.plugin.settings.SourceFolders[index] = value;
                await this.plugin.saveSettings();
            }))
        
        new Setting(recordEl)
        .setClass("wide-text-entry")
        .setName("Image URL")
        .addText((text)=> text
            .setValue(this.plugin.settings.NoteBG[index])
            .onChange(async (value) =>{
                this.plugin.settings.NoteBG[index] = value;
                await this.plugin.saveSettings();
            }))
        new ButtonComponent(recordEl)
    .onClick(async  (event) => {
        await this.RemoveRecord(index)
        })
    .buttonEl.setText("X");
    });
  }

  AddRecord()
  {
    this.plugin.settings.SourceFolders.push("");
    this.plugin.settings.NoteBG.push("");
    this.plugin.saveSettings();
    this.display()
  }

  RemoveRecord(index: number)
  {
    if (index> -1)
    {
        this.plugin.settings.SourceFolders.splice(index,1);
        this.plugin.settings.NoteBG.splice(index,1);
        this.plugin.saveSettings();
        this.display()
    }
  }
}

