
exports.validateEmail = function(_email) {
	if(!_email) return false;
	if(_email.match(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) {
		return true;
	} else {
		return false;
	}
}

