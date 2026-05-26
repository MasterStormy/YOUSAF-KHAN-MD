const NodeCache = require("node-cache");

// Initialize cache with no expiration (data persists)
const db = new NodeCache({ stdTTL: 0, checkperiod: 0 });

class Database {
    constructor() {
        this.cache = db;
    }

    // Get data
    get(key) {
        return this.cache.get(key);
    }

    // Set data
    set(key, value) {
        return this.cache.set(key, value);
    }

    // Delete data
    delete(key) {
        return this.cache.del(key);
    }

    // Get all keys
    keys() {
        return this.cache.keys();
    }

    // Check if key exists
    has(key) {
        return this.cache.has(key);
    }

    // Get settings for a user/group
    getSettings(id) {
        const settings = this.get(`settings_${id}`);
        if (!settings) {
            const defaultSettings = require("./config").defaultSettings;
            this.set(`settings_${id}`, defaultSettings);
            return defaultSettings;
        }
        return settings;
    }

    // Update setting for a user/group
    updateSetting(id, key, value) {
        const settings = this.getSettings(id);
        settings[key] = value;
        this.set(`settings_${id}`, settings);
        return settings;
    }

    // Save blocked users
    getBlockedUsers() {
        return this.get("blockedUsers") || [];
    }

    addBlockedUser(userId) {
        const blocked = this.getBlockedUsers();
        if (!blocked.includes(userId)) {
            blocked.push(userId);
            this.set("blockedUsers", blocked);
        }
    }

    removeBlockedUser(userId) {
        const blocked = this.getBlockedUsers();
        const index = blocked.indexOf(userId);
        if (index > -1) {
            blocked.splice(index, 1);
            this.set("blockedUsers", blocked);
        }
    }

    // Save banned users
    getBannedUsers() {
        return this.get("bannedUsers") || [];
    }

    addBannedUser(userId) {
        const banned = this.getBannedUsers();
        if (!banned.includes(userId)) {
            banned.push(userId);
            this.set("bannedUsers", banned);
        }
    }

    removeBannedUser(userId) {
        const banned = this.getBannedUsers();
        const index = banned.indexOf(userId);
        if (index > -1) {
            banned.splice(index, 1);
            this.set("bannedUsers", banned);
        }
    }
}

module.exports = new Database();