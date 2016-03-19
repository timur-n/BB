angular.module('BBStorage', [])
    .factory('bbStorage', ['$log', function($log) {
        return {
            set: function(name, value) {
                //$log.debug('bb-storage.set()', name, value);
                var storage = {};
                storage[name] = value;
                chrome.storage.local.set(storage, function() {
                    //$log.debug('bb-storage.set(): saved');
                });
            },
            get: function(name, callback) {
                //$log.debug('bb-storage.get()', name);
                chrome.storage.local.get(name, function(items) {
                    //$log.debug('bb-storage.get(): loaded', items[name]);
                    callback(items[name]);
                });
            },
            clean: function() {
                chrome.storage.local.clear();
            }
        };
    }]);

