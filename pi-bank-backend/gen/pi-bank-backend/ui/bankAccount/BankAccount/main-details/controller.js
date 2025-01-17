angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.bankAccount.BankAccount';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountService.ts";
	}])
	.controller('PageController', ['$scope', 'Extensions', 'messageHub', 'entityApi', function ($scope, Extensions, messageHub, entityApi) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: "BankAccount Details",
			create: "Create BankAccount",
			update: "Update BankAccount"
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'pi-bank-backend-custom-action').then(function (response) {
			$scope.entityActions = response.filter(e => e.perspective === "bankAccount" && e.view === "BankAccount" && e.type === "entity");
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
				$scope.optionsUser = [];
				$scope.optionsCurrency = [];
				$scope.optionsType = [];
				$scope.optionsStatus = [];
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("entitySelected", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.CreationDate) {
					msg.data.entity.CreationDate = new Date(msg.data.entity.CreationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsUser = msg.data.optionsUser;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.optionsType = msg.data.optionsType;
				$scope.optionsStatus = msg.data.optionsStatus;
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("createEntity", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsUser = msg.data.optionsUser;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.optionsType = msg.data.optionsType;
				$scope.optionsStatus = msg.data.optionsStatus;
				$scope.action = 'create';
			});
		});

		messageHub.onDidReceiveMessage("updateEntity", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.CreationDate) {
					msg.data.entity.CreationDate = new Date(msg.data.entity.CreationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsUser = msg.data.optionsUser;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.optionsType = msg.data.optionsType;
				$scope.optionsStatus = msg.data.optionsStatus;
				$scope.action = 'update';
			});
		});

		$scope.serviceUser = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/user/UserService.ts";
		$scope.serviceCurrency = "/services/ts/codbex-currencies/gen/codbex-currencies/api/Currencies/CurrencyService.ts";
		$scope.serviceType = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/BankAccountTypeService.ts";
		$scope.serviceStatus = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/BankAccountStatusService.ts";

		//-----------------Events-------------------//

		$scope.create = function () {
			entityApi.create($scope.entity).then(function (response) {
				if (response.status != 201) {
					messageHub.showAlertError("BankAccount", `Unable to create BankAccount: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityCreated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("BankAccount", "BankAccount successfully created");
			});
		};

		$scope.update = function () {
			entityApi.update($scope.entity.Id, $scope.entity).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("BankAccount", `Unable to update BankAccount: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityUpdated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("BankAccount", "BankAccount successfully updated");
			});
		};

		$scope.cancel = function () {
			messageHub.postMessage("clearDetails");
		};

	}]);