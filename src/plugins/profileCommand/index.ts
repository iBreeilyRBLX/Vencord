/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption } from "@api/Commands";
import { Devs } from "@utils/constants";
import { fetchUserProfile } from "@utils/discord";
import definePlugin from "@utils/types";
import { FluxDispatcher, SelectedChannelStore, SelectedGuildStore, UserStore, UserUtils } from "@webpack/common";

async function openServerProfile(id: string) {
    const user = await UserUtils.getUser(id);
    if (!user) throw new Error("No such user: " + id);

    const guildId = SelectedGuildStore.getGuildId();

    if (guildId) {
        // In a server - fetch guild member profile data first
        await fetchUserProfile(id, { guild_id: guildId });
    }

    // Open profile modal with guild context (or null for DMs)
    FluxDispatcher.dispatch({
        type: "USER_PROFILE_MODAL_OPEN",
        userId: id,
        guildId,
        channelId: SelectedChannelStore.getChannelId(),
        sourceAnalyticsLocations: [{
            page: guildId ? "Guild Channel" : "DM Channel",
            section: guildId ? "Guild Profile Popout" : "Profile Popout"
        }]
    });
}

export default definePlugin({
    name: "ProfileCommand",
    description: "Adds a /profile command to open someone's profile (server profile in servers, main profile in DMs)",
    authors: [Devs.Sqaaakoi],
    dependencies: ["CommandsAPI"],
    commands: [
        {
            name: "profile",
            description: "Open a user profile (server profile in servers, main profile in DMs)",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [{
                name: "user",
                description: "The user profile you want to view. Leave empty to view your own profile",
                required: false,
                type: ApplicationCommandOptionType.USER
            }],
            execute: (args, _ctx) => openServerProfile(findOption(args, "user", UserStore.getCurrentUser().id))
        }
    ]
});
