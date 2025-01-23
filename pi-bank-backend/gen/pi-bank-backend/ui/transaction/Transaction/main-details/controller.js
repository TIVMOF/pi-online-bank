angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.transaction.Transaction';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/transaction/TransactionService.ts";
	}])
	.controller('PageController', ['$scope', 'Extensions', 'messageHub', 'entityApi', function ($scope, Extensions, messageHub, entityApi) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: "Transaction Details",
			create: "Create Transaction",
			update: "Update Transaction"
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'pi-bank-backend-custom-action').then(function (response) {
			$scope.entityActions = response.filter(e => e.perspective === "transaction" && e.view === "Transaction" && e.type === "entity");
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
				$scope.optionsReciever = [];
				$scope.optionsSender = [];
				$scope.optionsCurrency = [];
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("entitySelected", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.Date) {
					msg.data.entity.Date = new Date(msg.data.entity.Date);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsReciever = msg.data.optionsReciever;
				$scope.optionsSender = msg.data.optionsSender;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("createEntity", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.optionsReciever = msg.data.optionsReciever;
				$scope.optionsSender = msg.data.optionsSender;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'create';
			});
		});

		messageHub.onDidReceiveMessage("updateEntity", function (msg) {
			$scope.$apply(function () {
				if (msg.data.entity.Date) {
					msg.data.entity.Date = new Date(msg.data.entity.Date);
				}
				$scope.entity = msg.data.entity;
				$scope.optionsReciever = msg.data.optionsReciever;
				$scope.optionsSender = msg.data.optionsSender;
				$scope.optionsCurrency = msg.data.optionsCurrency;
				$scope.action = 'update';
			});
		});

		$scope.serviceReciever = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountService.ts";
		$scope.serviceSender = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountService.ts";
		$scope.serviceCurrency = "/services/ts/codbex-currencies/gen/codbex-currencies/api/Currencies/CurrencyService.ts";

		//-----------------Events-------------------//

		$scope.create = function () {
			entityApi.create($scope.entity).then(function (response) {
				if (response.status != 201) {
					messageHub.showAlertError("Transaction", `Unable to create Transaction: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityCreated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Transaction", "Transaction successfully created");
			});
		};

		$scope.update = function () {
			entityApi.update($scope.entity.Id, $scope.entity).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("Transaction", `Unable to update Transaction: '${response.message}'`);
					return;
				}
				messageHub.postMessage("entityUpdated", response.data);
				messageHub.postMessage("clearDetails", response.data);
				messageHub.showAlertSuccess("Transaction", "Transaction successfully updated");
			});
		};

		$scope.cancel = function () {
			messageHub.postMessage("clearDetails");
		};

	}]);