angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.cards.Cards';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/cards/CardsService.ts";
	}])
	.controller('PageController', ['$scope', 'Extensions', 'messageHub', 'entityApi', function ($scope, Extensions, messageHub, entityApi) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: "Cards Details",
			create: "Create Cards",
			update: "Update Cards"
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'pi-bank-backend-custom-action').then(function (response) {
			$scope.entityActions = response.filter(e => e.perspective === "cards" && e.view === "Cards" && e.type === "entity");
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
				$scope.optionsBankAccounts = [];
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
				$scope.optionsBankAccounts = msg.data.optionsBankAccounts;
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("createEntity", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsCardType = msg.data.optionsCardType;
				$scope.optionsBankAccounts = msg.data.optionsBankAccounts;
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
				$scope.optionsBankAccounts = msg.data.optionsBankAccounts;
				$scope.action = 'update';
			});
		});

		$scope.serviceCardType = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/CardTypeService.ts";
		$scope.serviceBankAccounts = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountsService.ts";

		//-----------------Events-------------------//

		$scope.create = function () {
			entityApi.create($scope.entity).then(function (response) {
				if (response.status != 201) {
					messageHub.showAlertError("Cards", `Unable to create Cards: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityCreated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Cards", "Cards successfully created");
			});
		};

		$scope.update = function () {
			entityApi.update($scope.entity.Id, $scope.entity).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("Cards", `Unable to update Cards: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityUpdated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Cards", "Cards successfully updated");
			});
		};

		$scope.cancel = function () {
			messageHub.postMessage("clearDetails");
		};

	}]);