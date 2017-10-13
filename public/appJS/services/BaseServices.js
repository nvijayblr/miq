'use strict';
backMe
.service('BaseServices', ['HttpServices', 'toastServices', 'paginationServices', 'mainServices', 'PoupupServices', function(_httpServices, _toastServices, _paginationServices, _mainServices, _poupupServices){
	this.http = _httpServices;
	this.toast = _toastServices;
	this.pagination = _paginationServices;
	this.main = _mainServices;
	this.popup = _poupupServices;
}]);