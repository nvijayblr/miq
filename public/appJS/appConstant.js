'use strict';
var _currentUser = '', _currentAdmin = '';
if(localStorage.getItem('backMeUser'))
	_currentUser = JSON.parse(localStorage.getItem('backMeUser'));

if(localStorage.getItem('backMeAdmin'))
	_currentAdmin = JSON.parse(localStorage.getItem('backMeAdmin'));

backMe.constant('appConstant', {
	currentUser: _currentUser,
	currentAdmin: _currentAdmin,
	fbKey: '211137599382729',
	linkedInKey: '',
	googleClientId: '47668821926-o59d17ntaav3fi8jvbkl0pc9d5gjukrm',
	baseUrl: 'http://localhost:3001/',
	/*googleClientId: '1022772628270-d0a4laj9hasu9ahg4gqjshqhq3pvboch',
	baseUrl: 'http://supportmytalent.in/',*/
	projectMaxDays: 999
});


//https://www.facebook.com/app_scoped_user_id/1542184795794214


//106615224166251291540

