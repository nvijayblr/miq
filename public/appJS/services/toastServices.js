'use strict';
backMe
.service('toastServices', ['$mdToast', function(_mdToast){

	this.show = function(_msg) {
		_mdToast.show({
		  hideDelay   : 3000,
		  position    : 'top right',
		  template : '<md-toast><span class="md-toast-text" flex>'+_msg+'</span></md-toast>'
		});
	}
	this.showProject = function(_msg) {
		var toast2 = _mdToast.simple({
		  hideDelay   : 3000,
		  position    : 'bottom'}).textContent('_msg');
		_mdToast.show(toast2);
	}
	this.hide = function() {
		_mdToast.hide();
	}
}]);