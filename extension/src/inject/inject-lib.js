window.bb = {
    normalizeCorrectScore: function(text, home, away) {
        var result = text;
        if (new RegExp(home, 'gi').test(text)) {
            result = '';
        }
    }
};