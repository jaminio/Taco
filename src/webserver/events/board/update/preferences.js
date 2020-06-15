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

exports.name = 'UPDATE_BOARD_PREFS';

exports.exec = async data => {
  const prefMap = {
    invitations: 'invite_perms',
    comments: 'comment_perms',
    voting: 'vote_perms',
    permissionLevel: 'perm_levels'
  };
  const pref = Object.keys(data.board.prefs)[0];

  if (prefMap[pref]) {
    const _ = data.localeModule;
    return data.send({
      title: _(`webhooks.board_set_${prefMap[pref]}`, {
        member: data.invoker.webhookSafeName,
        board: data.util.cutoffText(data.board.name, 50),
        oldPerm: _(`trello.${prefMap[pref]}.${data.oldData.prefs[pref]}`),
        perm: _(`trello.${prefMap[pref]}.${data.board.prefs[pref]}`)
      }),
      description: '',
    });
  }
};