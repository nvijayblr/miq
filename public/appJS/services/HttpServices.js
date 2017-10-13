'use strict';
backMe
	.service('HttpServices', ['$http', "$state", '$filter', 'appConstant', function (_http, _state, _filter, _appConstant) {
		this.serve = function (_params, _successCallback, _errorCallback, _finallyCallback) {
			var _requestParam = {
				'method': _params['method'],
				'url': _params['url'],
				data: _params['inputData'] ? _params['inputData'] : {},
				headers: {
					'Content-Type': "application/json"
				}
			};
			var _curUser = _appConstant.currentUser;
			if (_curUser) {
				_requestParam.headers._APISID = _curUser._APISID;
				_requestParam.headers._BPISID = _curUser._BPISID;
				_requestParam.headers._CPISID = _curUser._CPISID;
			}
			_http(_requestParam).then(function (result) {
				if (_successCallback)
					_successCallback(result.data);
			}, function (error) {
				console.log(error);
				if (_errorCallback)
					_errorCallback(error);
			}).finally(function () {
				if (typeof _finallyCallback == 'function')
					_finallyCallback();
			});
		};
}]);
