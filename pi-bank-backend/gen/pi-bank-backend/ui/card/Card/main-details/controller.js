angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.card.Card';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/card/CardService.ts";
	}])
	.controller('PageController', ['$scope', 'Extensions', 'messageHub', 'entityApi', function ($scope, Extensions, messageHub, entityApi) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: "Card Details",
			create: "Create Card",
			update: "Update Card"
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'pi-bank-backend-custom-action').then(function (response) {
			$scope.entityActions = response.filter(e => e.perspective === "card" && e.view === "Card" && e.type === "entity");
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
				$scope.optionsCardType = [];
				$scope.optionsBankAccount = [];
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("entitySelected", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.ExpirationDate) {
					msg.data.entity.ExpirationDate = new Date(msg.data.entity.ExpirationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsCardType = msg.data.optionsCardType;
				$scope.optionsBankAccount = msg.data.optionsBankAccount;
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("createEntity", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsCardType = msg.data.optionsCardType;
				$scope.optionsBankAccount = msg.data.optionsBankAccount;
				$scope.action = 'create';
			});
		});

		messageHub.onDidReceiveMessage("updateEntity", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.ExpirationDate) {
					msg.data.entity.ExpirationDate = new Date(msg.data.entity.ExpirationDate);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsCardType = msg.data.optionsCardType;
				$scope.optionsBankAccount = msg.data.optionsBankAccount;
				$scope.action = 'update';
			});
		});

		$scope.serviceCardType = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/CardTypeService.ts";
		$scope.serviceBankAccount = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountService.ts";

		//-----------------Events-------------------//

		$scope.create = function () {
			entityApi.create($scope.entity).then(function (response) {
				if (response.status != 201) {
					messageHub.showAlertError("Card", `Unable to create Card: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityCreated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Card", "Card successfully created");
			});
		};

		$scope.update = function () {
			entityApi.update($scope.entity.Id, $scope.entity).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("Card", `Unable to update Card: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityUpdated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Card", "Card successfully updated");
			});
		};

		$scope.cancel = function () {
			messageHub.postMessage("clearDetails");
		};

	}]);