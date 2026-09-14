window.offlineRangerSync = {
    saveObservationOffline: function (key, dataJson) {
        try {
            localStorage.setItem("ranger_obs_" + key, dataJson);
            return true;
        } catch (e) {
            console.error("Failed to store observation offline", e);
            return false;
        }
    },
    getPendingObservations: function () {
        let items = [];
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith("ranger_obs_")) {
                try {
                    items.push(JSON.parse(localStorage.getItem(key)));
                } catch (e) {
                    console.error("Error parsing observation", e);
                }
            }
        }
        return items;
    },
    clearSyncedObservation: function (key) {
        localStorage.removeItem("ranger_obs_" + key);
    }
};
