/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, PluginSettingDef } from "@utils/types";
import { GuildMember, Role } from "@vencord/discord-types";

const opt = (description: string) => ({
    type: OptionType.BOOLEAN,
    description,
    default: true,
    restartNeeded: true
} satisfies PluginSettingDef);

const settings = definePluginSettings({
    showTimeouts: opt("Show member timeout icons in chat."),
    showInvitesPaused: opt("Show the invites paused tooltip in the server list."),
    showModView: opt("Show the member mod view context menu item in all servers."),
    showMembersPageInSettings: opt("Shows the member page in the settings of non-community servers even if Show Members in Channel List is enabled, and disable the redirect to the sidebar in community servers."),
    showMembersPageInSidebar: opt("Shows the member page in sidebar of non-community servers regardless of the Show Members in Channel List setting."),
    bannerColorPicker: opt("Show the non-Nitro banner color picker in the profile editor when you have Nitro"),
});

export default definePlugin({
    name: "ShowHiddenThings",
    tags: ["ShowTimeouts", "ShowInvitesPaused", "ShowModView", "DisableDiscoveryFilters", "ShowMembersPage"],
    description: "Displays various hidden & moderator-only things regardless of permissions.",
    authors: [Devs.Dolfies, Devs.Sqaaakoi],
    settings,

    patches: [
        {
            find: "showCommunicationDisabledStyles",
            predicate: () => settings.store.showTimeouts,
            replacement: {
                match: /&&\i\.\i\.canManageUser\(\i\.\i\.MODERATE_MEMBERS,\i\.author,\i\)/,
                replace: "",
            },
        },
        {
            find: "INVITES_DISABLED))||",
            predicate: () => settings.store.showInvitesPaused,
            replacement: {
                match: /\i\.\i\.can\(\i\.\i.MANAGE_GUILD,\i\)/,
                replace: "true",
            },
        },
        {
            find: /,checkElevated:!1}\),\i\.\i\)}(?<=getCurrentUser\(\);return.+?)/,
            predicate: () => settings.store.showModView,
            replacement: {
                match: /return \i\.\i\(\i\.\i\(\{user:\i,context:\i,checkElevated:!1\}\),\i\.\i\)/,
                replace: "return true",
            }
        },
        // fixes a bug where Members page must be loaded to see highest role, why is Discord depending on MemberSafetyStore.getEnhancedMember for something that can be obtained here?
        {
            find: "#{intl::GUILD_MEMBER_MOD_VIEW_PERMISSION_GRANTED_BY_ARIA_LABEL}),allowOverflow:",
            predicate: () => settings.store.showModView,
            replacement: {
                match: /(?<=\.highestRole\),)role:\i(?<=\[\i\.roles,\i\.highestRoleId,(\i)\].+)/,
                replace: "role:$self.getHighestRole(arguments[0],$1)",
            }
        },
        // allows you to open mod view on yourself
        {
            find: 'action:"PRESS_MOD_VIEW",icon:',
            predicate: () => settings.store.showModView,
            replacement: {
                match: /\i(?=\?null)/,
                replace: "false"
            }
        }
    ],

    getHighestRole({ member }: { member: GuildMember; }, roles: Role[]): Role | undefined {
        try {
            return roles.find(role => role.id === member.highestRoleId);
        } catch (e) {
            new Logger("ShowHiddenThings").error("Failed to find highest role", e);
            return undefined;
        }
    }
});
