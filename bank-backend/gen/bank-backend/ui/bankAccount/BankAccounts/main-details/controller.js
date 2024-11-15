angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'bank-backend.bankAccount.BankAccounts';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/bank-backend/gen/bank-backend/api/bankAccount/BankAccountsService.ts";
	}])
	.controller('PageController', ['$scope', 'Extensions', 'messageHub', 'entityApi', function ($scope, Extensions, messageHub, entityApi) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: "BankAccounts Details",
			create: "Create BankAccounts",
			update: "Update BankAccounts"
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'bank-backend-custom-action').then(function (response) {
			$scope.entityActions = response.filter(e => e.perspective === "bankAccount" && e.view === "BankAccounts" && e.type === "entity");
		});

		$scope.triggerEntityAction = function (action) {
			messageHub.showDialogWindow(
				action.id,
				{
					id: $scope.entity.Id
				},
				null,
				true,
				action
			);
		};
		//-----------------Custom Actions-------------------//

		//-----------------Events-------------------//
		messageHub.onDidReceiveMessage("clearDetails", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsUsers = [];
				$scope.optionsBankAccountType = [];
				$scope.optionsBankAccountStatus = [];
				$scope.optionsCurrency = [];
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("entitySelected", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.CreationDate) {
					msg.data.entity.CreationDate = new Date(msg.data.entity.CreationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsUsers = msg.data.optionsUsers;
				$scope.optionsBankAccountType = msg.data.optionsBankAccountType;
				$scope.optionsBankAccountStatus = msg.data.optionsBankAccountStatus;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("createEntity", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsUsers = msg.data.optionsUsers;
				$scope.optionsBankAccountType = msg.data.optionsBankAccountType;
				$scope.optionsBankAccountStatus = msg.data.optionsBankAccountStatus;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'create';
			});
		});

		messageHub.onDidReceiveMessage("updateEntity", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.CreationDate) {
					msg.data.entity.CreationDate = new Date(msg.data.entity.CreationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsUsers = msg.data.optionsUsers;
				$scope.optionsBankAccountType = msg.data.optionsBankAccountType;
				$scope.optionsBankAccountStatus = msg.data.optionsBankAccountStatus;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'update';
			});
		});

		$scope.serviceUsers = "/services/ts/bank-backend/gen/bank-backend/api/users/UsersService.ts";
		$scope.serviceBankAccountType = "/services/ts/bank-backend/gen/bank-backend/api/Settings/BankAccountTypeService.ts";
		$scope.serviceBankAccountStatus = "/services/ts/bank-backend/gen/bank-backend/api/Settings/BankAccountStatusService.ts";
		$scope.serviceCurrency = "/services/ts/codbex-currencies/gen/codbex-currencies/api/Currencies/CurrencyService.ts";

		//-----------------Events-------------------//

		$scope.create = function () {
			entityApi.create($scope.entity).then(function (response) {
				if (response.status != 201) {
					messageHub.showAlertError("BankAccounts", `Unable to create BankAccounts: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityCreated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("BankAccounts", "BankAccounts successfully created");
			});
		};

		$scope.update = function () {
			entityApi.update($scope.entity.Id, $scope.entity).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("BankAccounts", `Unable to update BankAccounts: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityUpdated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("BankAccounts", "BankAccounts successfully updated");
			});
		};

		$scope.cancel = function () {
			messageHub.postMessage("clearDetails");
		};

	}]);