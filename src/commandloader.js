/*
 This file is part of TrelloBot.
 Copyright (c) Snazzah 2016 - 2019
 Copyright (c) Trello Talk Team 2019 - 2020

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const fs = require('fs');
const path = require('path');
const reload = require('require-reload')(require);

module.exports = class CommandLoader {
  constructor(client, cPath) {
    this.commands = [];
    this.path = path.resolve(cPath);
    this.client = client;
  }

  /**
   * Loads commands from a folder
   * @param {String} folderPath
   */
  iterateFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    files.map(file => {
      const filePath = path.join(folderPath, file);
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        const realPath = fs.readlinkSync(filePath);
        if (stat.isFile() && file.endsWith('.js')) {
          this.load(realPath);
        } else if (stat.isDirectory()) {
          this.iterateFolder(realPath);
        }
      } else if (stat.isFile() && file.endsWith('.js'))
        this.load(filePath);
      else if (stat.isDirectory())
        this.iterateFolder(filePath);
    });
  }

  /**
   * Loads a command
   * @param {string} commandPath
   */
  load(commandPath) {
    console.fileload('Loading command', commandPath);
    const cls = reload(commandPath);
    const cmd = new cls(this.client);
    cmd.path = commandPath;
    this.commands.push(cmd);
    return cmd;
  }

  /**
   * Reloads all commands
   */
  reload() {
    this.commands = [];
    this.iterateFolder(this.path);
  }

  /**
   * Gets a command based on it's name or alias
   * @param {string} name The command's name or alias
   */
  get(name) {
    let cmd = this.commands.find(c => c.name === name);
    if (cmd) return cmd;
    this.commands.forEach(c => {
      if (c.options.aliases.includes(name)) cmd = c;
    });
    return cmd;
  }

  /**
   * Preloads a command
   * @param {string} name The command's name or alias
   */
  preload(name) {
    if (!this.get(name)) return;
    this.get(name)._preload();
  }

  /**
   * Preloads all commands
   */
  preloadAll() {
    this.commands.forEach(c => c._preload());
  }

  /**
   * Processes the cooldown of a command
   * @param {Message} message
   * @param {Command} command
   */
  async processCooldown(message, command) {
    if (this.client.config.elevated.includes(message.author.id)) return true;
    const now = Date.now() - 1;
    const cooldown = command.cooldownAbs;
    let userCD = await this.client.db.hget(`cooldowns:${message.author.id}`, command.name) || 0;
    if (userCD) userCD = parseInt(userCD);
    if (userCD + cooldown > now) return false;
    await this.client.db.hset(`cooldowns:${message.author.id}`, command.name, now);
    return true;
  }
};