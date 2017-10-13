'use strict';
var backMe = angular.module('backMe', ['ui.router', 'angular-loading-bar', 'ngMaterial', 'ngMessages', 'facebook', 'ngFileUpload', 'thatisuday.ng-image-gallery', '720kb.socialshare', 'ngImgCrop', 'vtex.ngCurrencyMask', 'uiCropper', 'ngDialog', 'socialLogin', 'angularMoment', 'youtube-embed']);

backMe
.config(['$stateProvider', '$urlRouterProvider', 'FacebookProvider', '$mdDateLocaleProvider', '$injector', 'socialProvider', 'appConstant', function(_stateProvider, _urlRouterProvider, FacebookProvider, _mdDateLocaleProvider, _injector, socialProvider, appConstant) {
    
    _urlRouterProvider.otherwise('/home');
    
    _stateProvider
		.state('home', {
				url: '/home',
				templateUrl: 'templates/home.html',
				controller: 'homeCtrl'
		})
		.state('course', {
				url: '/course/:courseId',
				templateUrl: 'templates/course.html',
				controller: 'courseCtrl'
		})
		.state('tests', {
				url: '/tests/:courseId',
				templateUrl: 'templates/tests.html',
				controller: 'testsCtrl'
		})
		.state('checkout', {
				url: '/checkout/:courseId',
				templateUrl: 'templates/checkout.html',
				controller: 'checkoutCtrl'
		})
		.state('payment', {
				url: '/payment/:paymentId',
				templateUrl: 'templates/payment.html',
				controller: 'paymentCtrl'
		})
		.state('dashboard', {
				url: '/dashboard/:userId',
				templateUrl: 'templates/dashboard.html',
				controller: 'dashboardCtrl'
		})
		.state('subscriptions', {
				abstract: true,
				url: '/subscriptions',
				template: '<div ui-view class="fade-view"/>',
				controller: 'subscriptionsCtrl'
		})
		.state('subscriptions.course', {
				url: '/course/:courseId',
				templateUrl: 'templates/subscriptionsCourse.html',
				controller: 'subscriptionsCourseCtrl'
		})
		.state('subscriptions.tests', {
				url: '/tests/:courseId',
				templateUrl: 'templates/subscriptionsTest.html',
				controller: 'subscriptionsTestCtrl'
		})
		.state('starttests', {
				url: '/start/test/:courseId/:testId',
				templateUrl: 'templates/starttests.html',
				controller: 'starttestsCtrl'
		})

		.state('create', {
				abstract: true,
				url: '/create',
				template: '<div ui-view class="fade-view"/>',
				controller: 'createprojectCtrl'
		})
		.state('create.startproject', {
				url: '/startproject',
				templateUrl: 'templates/startproject.html',
				controller: 'startprojectCtrl'
		})
		.state('create.basicinfo', {
				url: '/basicinfo/:projectId',
				templateUrl: 'templates/basicinfo.html',
				controller: 'basicinfoCtrl'
		})
		.state('create.projectdetails', {
				url: '/projectdetails/:projectId',
				templateUrl: 'templates/projectdetails.html',
				controller: 'projectdetailsCtrl'
		})
		.state('create.rewards', {
				url: '/rewards/:projectId',
				templateUrl: 'templates/rewards.html',
				controller: 'rewardsCtrl'
		})
		.state('create.profile', {
				url: '/profile/:projectId',
				templateUrl: 'templates/profile.html',
				controller: 'profileCtrl'
		})
		.state('create.preview', {
				url: '/preview/:projectId',
				templateUrl: 'templates/preview.html',
				controller: 'previewCtrl'
		})
		.state('edit', {
				abstract: true,
				url: '/edit',
				template: '<div ui-view class="fade-view"/>',
				controller: 'editProjectCtrl'
		})
		.state('edit.basicinfo', {
				url: '/basicinfo/:projectId',
				templateUrl: 'templates/basicinfo.html',
				controller: 'basicinfoCtrl'
		})
		.state('edit.projectdetails', {
				url: '/projectdetails/:projectId',
				templateUrl: 'templates/projectdetails.html',
				controller: 'projectdetailsCtrl'
		})
		.state('edit.rewards', {
				url: '/rewards/:projectId',
				templateUrl: 'templates/rewards.html',
				controller: 'rewardsCtrl'
		})
		.state('edit.profile', {
				url: '/profile/:projectId',
				templateUrl: 'templates/profile.html',
				controller: 'profileCtrl'
		})
		.state('edit.preview', {
				url: '/preview/:projectId',
				templateUrl: 'templates/preview.html',
				controller: 'previewCtrl'
		})
		.state('project', {
				url: '/project/:projectId',
				templateUrl: 'templates/project.html',
				controller: 'projectCtrl'
		})
		/*.state('admin', {
				abstract: true,
				url: '/admin',
				template: '<div ui-view class="fade-view"/>',
				controller: 'adminCtrl'
		})*/
		.state('adminRoot', {
				url: '/admin/',
				templateUrl: 'templates/admin/adminLogin.html',
				controller: 'adminLoginCtrl'
		})
		.state('adminLogin', {
				url: '/admin/login',
				templateUrl: 'templates/admin/adminLogin.html',
				controller: 'adminLoginCtrl'
		})
		.state('admin', {
				abstract: true,
				url: '/admin',
				templateUrl: 'templates/admin/adminMain.html',
				controller: 'adminCtrl'
		})
		.state('admin.dashboard', {
				url: '/dashboard',
				templateUrl: 'templates/admin/dashboard.html',
				controller: 'adminDashboardCtrl'
		})
		.state('admin.admins', {
				url: '/admins',
				templateUrl: 'templates/admin/admins.html',
				controller: 'adminAdminsCtrl'
		})
		.state('admin.users', {
				url: '/users',
				templateUrl: 'templates/admin/users.html',
				controller: 'adminUsersCtrl'
		})
		.state('admin.projects', {
				url: '/projects',
				templateUrl: 'templates/admin/projects.html',
				controller: 'adminProjectsCtrl'
		})
		.state('admin.promotions', {
				url: '/promotions',
				templateUrl: 'templates/admin/promotions.html',
				controller: 'adminPromotionsCtrl'
		})
		.state('admin.project', {
				url: '/project/:projectId',
				templateUrl: 'templates/admin/project.html',
				controller: 'adminProjectCtrl'
		})
		.state('admin.payments', {
				url: '/payments',
				templateUrl: 'templates/admin/payments.html',
				controller: 'adminPaymentsCtrl'
		})
		.state('admin.category', {
				url: '/category',
				templateUrl: 'templates/admin/category.html',
				controller: 'adminCategoryCtrl'
		})
		.state('admin.banks', {
				url: '/banks',
				templateUrl: 'templates/admin/banks.html',
				controller: 'adminBanksCtrl'
		})
		.state('admin.cities', {
				url: '/cities',
				templateUrl: 'templates/admin/cities.html',
				controller: 'adminCitiesCtrl'
		})
		.state('admin.comments', {
				url: '/comments',
				templateUrl: 'templates/admin/comments.html',
				controller: 'adminCommentsCtrl'
		})
		.state('admin.reports', {
				url: '/reports',
				templateUrl: 'templates/admin/reports.html',
				controller: 'adminReportsCtrl'
		})
		.state('admin.account', {
				url: '/account',
				templateUrl: 'templates/admin/account.html',
				controller: 'adminAccountCtrl'
		})
	
		//Other Pages
		.state('about', {
				url: '/about',
				templateUrl: 'templates/about.html',
				controller: 'commonPagesCtrl'
		})
		.state('team', {
				url: '/team',
				templateUrl: 'templates/team.html',
				controller: 'commonPagesCtrl'
		})
		.state('privacy-policy', {
				url: '/privacy-policy',
				templateUrl: 'templates/privacy-policy.html',
				controller: 'commonPagesCtrl'
		})
		.state('terms-of-sale', {
				url: '/terms-of-sale',
				templateUrl: 'templates/terms-of-sale.html',
				controller: 'commonPagesCtrl'
		})
		.state('terms-of-use', {
				url: '/terms-of-use',
				templateUrl: 'templates/terms-of-use.html',
				controller: 'commonPagesCtrl'
		})
		.state('report-abuse', {
				url: '/report-abuse',
				templateUrl: 'templates/report-abuse.html',
				controller: 'commonPagesCtrl'
		})
		.state('csr-policy', {
				url: '/csr-policy',
				templateUrl: 'templates/csr-policy.html',
				controller: 'commonPagesCtrl'
		})
		.state('core-values', {
				url: '/core-values',
				templateUrl: 'templates/core-values.html',
				controller: 'commonPagesCtrl'
		})
		.state('careers', {
				url: '/careers',
				templateUrl: 'templates/careers.html',
				controller: 'commonPagesCtrl'
		})
		.state('blog', {
				url: '/blog',
				templateUrl: 'templates/blog.html',
				controller: 'commonPagesCtrl'
		})
		.state('engineering', {
				url: '/engineering',
				templateUrl: 'templates/engineering.html',
				controller: 'commonPagesCtrl'
		})
		.state('sitemap', {
				url: '/sitemap',
				templateUrl: 'templates/sitemap.html',
				controller: 'commonPagesCtrl'
		})
		.state('infortainment-media-us', {
				url: '/infortainment-media-us',
				templateUrl: 'templates/infortainment-media-us.html',
				controller: 'commonPagesCtrl'
		})
		.state('tech-limited', {
				url: '/tech-limited',
				templateUrl: 'templates/tech-limited.html',
				controller: 'commonPagesCtrl'
		})
		.state('india-inc', {
				url: '/india-inc',
				templateUrl: 'templates/india-inc.html',
				controller: 'commonPagesCtrl'
		})
		.state('faq', {
				url: '/faq',
				templateUrl: 'templates/faq.html',
				controller: 'commonPagesCtrl'
		})
		.state('contact-us', {
				url: '/contact-us',
				templateUrl: 'templates/contact-us.html',
				controller: 'commonPagesCtrl'
		})

		;
		/*config facebook login button*/
		FacebookProvider.init(appConstant.fbKey);

		//socialProvider.setGoogleKey(appConstant.googleClientId);
		//socialProvider.setLinkedInKey("YOUR LINKEDIN CLIENT ID");
		//socialProvider.setFbKey({appId: appConstant.fbKey, apiVersion: "v2.0"});

		_mdDateLocaleProvider.formatDate = function(date) {
		   return moment(date).format('MM/DD/YYYY');
		};

}]);

backMe.run(['$rootScope', '$window', function(_rootScope, _window) {
	console.log('app run phase...')
}]);
