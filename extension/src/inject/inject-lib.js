(function () {

    var nameRexExp = /([A-z ]*)(\sv\s)([A-z ]*)/i;

    window.bb = {
        normalizeCorrectScore: function (text, home, away) {

            function regexp(str) {
                return new RegExp('(' + str + ')[ ]*([0-3])[ ]*-[ ]*([0-3])', 'gi');
            }

            var result = '';
            if (new RegExp(home, 'gi').test(text)) {
                result = text.replace(regexp(home), '$2 - $3');
            }
            if (new RegExp(away, 'gi').test(text)) {
                result = text.replace(regexp(away), '$3 - $2');
            }
            if (/draw/gi.test(text)) {
                result = text.replace(regexp('draw'), '$2 - $3');
            }
            if (result === text) {
                result = ''; // clear things if no replacements were made (e.g. score > 3)
            }
            return result;
        },

        normalizeHtFt: function (text) {
            return text.replace(' / ', '/');
        },

        getHome: function (eventName) {
            return eventName.replace(nameRexExp, '$1');
        },
        getAway: function (eventName) {
            return eventName.replace(nameRexExp, '$3');
        },

        // JQuery helpers
        getTextNoChildren: function ($item) {
            return this.getText($item.clone().children().remove().end());
        },
        getText: function ($item) {
            return $item.text().trim().replace(/\s*\n\s*/g, ' ');
        }
    };
})();