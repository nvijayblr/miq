var commonFunction = {
    validateUser: function (db, _headers, _error, _succes) {
        if (!_headers._apisid || !_headers._bpisid || !_headers._cpisid) _error();
        else {
            db.query('SELECT * FROM user_sessions WHERE uss_code = ?', [_headers._apisid + _headers._cpisid + _headers._bpisid], function (error, result) {
                if (error) {
                    _error();
                    throw error;
                    return;
                }; /*end of the error block*/
                if (result.length == 0) _error();
                else _succes(result[0]['user_id']);
            });
        }
    },
    generateSessonToken: function () {
        var possibleString = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            randomString = '',
            opArray = [];
        for (var i = 0; i < 10; i++) {
            randomString += possibleString.charAt(Math.floor(Math.random() * 62));
        }
        opArray.push(randomString);
        randomString = '';
        for (var i = 0; i < 10; i++) {
            randomString += possibleString.charAt(Math.floor(Math.random() * 62));
        }
        opArray.push(randomString);
        return opArray;
    },
    currentDTTM: function () {
        var _temp = new Date();
        return _temp.getFullYear() + '-' + (_temp.getMonth() + 1) + '-' + _temp.getDate() + ' ' + _temp.getHours() + ':' + _temp.getMinutes() + ':' + _temp.getSeconds();
    }
};

module.exports = commonFunction;
