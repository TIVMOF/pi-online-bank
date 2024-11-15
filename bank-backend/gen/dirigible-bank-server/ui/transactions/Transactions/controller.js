angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'dirigible-bank-server.transactions.Transactions';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/dirigible-bank-server/gen/dirigible-bank-server/api/transactions/TransactionsService.ts";
	}])
	.controller('PageController', ['$scope', '$http', 'messageHub', 'entityApi', 'Extensions', function ($scope, $http, messageHub, entityApi, Extensions) {

		$scope.dataPage = 1;
		$scope.dataCount = 0;
		$scope.dataLimit = 20;

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'dirigible-bank-server-custom-action').then(function (response) {
			$scope.pageActions = response.filter(e => e.perspective === "transactions" && e.view === "Transactions" && (e.type === "page" || e.type === undefined));
			$scope.entityActions = response.filter(e => e.perspective === "transactions" && e.view === "Transactions" && e.type === "entity");
		});

		$scope.triggerPageAction = function (action) {
			messageHub.showDialogWindow(
				action.id,
				{},
				null,
				true,
				action
			);
		};

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

		function resetPagination() {
			$scope.dataPage = 1;
			$scope.dataCount = 0;
			$scope.dataLimit = 20;
		}
		resetPagination();

		//-----------------Events-------------------//
		messageHub.onDidReceiveMessage("entityCreated", function (msg) {
			$scope.loadPage($scope.dataPage, $scope.filter);
		});

		messageHub.onDidReceiveMessage("entityUpdated", function (msg) {
			$scope.loadPage($scope.dataPage, $scope.filter);
		});

		messageHub.onDidReceiveMessage("entitySearch", function (msg) {
			resetPagination();
			$scope.filter = msg.data.filter;
			$scope.filterEntity = msg.data.entity;
			$scope.loadPage($scope.dataPage, $scope.filter);
		});
		//-----------------Events-------------------//

		$scope.loadPage = function (pageNumber, filter) {
			if (!filter && $scope.filter) {
				filter = $scope.filter;
			}
			$scope.dataPage = pageNumber;
			entityApi.count(filter).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("Transactions", `Unable to count Transactions: '${response.message}'`);
					return;
				}
				if (response.data) {
					$scope.dataCount = response.data;
				}
				let offset = (pageNumber - 1) * $scope.dataLimit;
				let limit = $scope.dataLimit;
				let request;
				if (filter) {
					filter.$offset = offset;
					filter.$limit = limit;
					request = entityApi.search(filter);
				} else {
					request = entityApi.list(offset, limit);
				}
				request.then(function (response) {
					if (response.status != 200) {
						messageHub.showAlertError("Transactions", `Unable to list/filter Transactions: '${response.message}'`);
						return;
					}

					response.data.forEach(e => {
						if (e.Date) {
							e.Date = new Date(e.Date);
						}
					});

					$scope.data = response.data;
				});
			});
		};
		$scope.loadPage($scope.dataPage, $scope.filter);

		$scope.selectEntity = function (entity) {
			$scope.selectedEntity = entity;
		};

		$scope.openDetails = function (entity) {
			$scope.selectedEntity = entity;
			messageHub.showDialogWindow("Transactions-details", {
				action: "select",
				entity: entity,
				optionsReciever: $scope.optionsReciever,
				optionsSender: $scope.optionsSender,
			});
		};

		$scope.openFilter = function (entity) {
			messageHub.showDialogWindow("Transactions-filter", {
				entity: $scope.filterEntity,
				optionsReciever: $scope.optionsReciever,
				optionsSender: $scope.optionsSender,
			});
		};

		$scope.createEntity = function () {
			$scope.selectedEntity = null;
			messageHub.showDialogWindow("Transactions-details", {
				action: "create",
				entity: {},
				optionsReciever: $scope.optionsReciever,
				optionsSender: $scope.optionsSender,
			}, null, false);
		};

		$scope.updateEntity = function (entity) {
			messageHub.showDialogWindow("Transactions-details", {
				action: "update",
				entity: entity,
				optionsReciever: $scope.optionsReciever,
				optionsSender: $scope.optionsSender,
			}, null, false);
		};

		$scope.deleteEntity = function (entity) {
			let id = entity.Id;
			messageHub.showDialogAsync(
				'Delete Transactions?',
				`Are you sure you want to delete Transactions? This action cannot be undone.`,
				[{
					id: "delete-btn-yes",
					type: "emphasized",
					label: "Yes",
				},
				{
					id: "delete-btn-no",
					type: "normal",
					label: "No",
				}],
			).then(function (msg) {
				if (msg.data === "delete-btn-yes") {
					entityApi.delete(id).then(function (response) {
						if (response.status != 204) {
							messageHub.showAlertError("Transactions", `Unable to delete Transactions: '${response.message}'`);
							return;
						}
						$scope.loadPage($scope.dataPage, $scope.filter);
						messageHub.postMessage("clearDetails");
					});
				}
			});
		};

		//----------------Dropdowns-----------------//
		$scope.optionsReciever = [];
		$scope.optionsSender = [];


		$http.get("/services/ts/dirigible-bank-server/gen/dirigible-bank-server/api/bankAccount/BankAccountsService.ts").then(function (response) {
			$scope.optionsReciever = response.data.map(e => {
				return {
					value: e.Id,
					text: e.IBAN
				}
			});
		});

		$http.get("/services/ts/dirigible-bank-server/gen/dirigible-bank-server/api/bankAccount/BankAccountsService.ts").then(function (response) {
			$scope.optionsSender = response.data.map(e => {
				return {
					value: e.Id,
					text: e.IBAN
				}
			});
		});

		$scope.optionsRecieverValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsReciever.length; i++) {
				if ($scope.optionsReciever[i].value === optionKey) {
					return $scope.optionsReciever[i].text;
				}
			}
			return null;
		};
		$scope.optionsSenderValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsSender.length; i++) {
				if ($scope.optionsSender[i].value === optionKey) {
					return $scope.optionsSender[i].text;
				}
			}
			return null;
		};
		//----------------Dropdowns-----------------//

	}]);
