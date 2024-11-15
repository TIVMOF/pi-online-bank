angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'bank-backend.cards.Cards';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/bank-backend/gen/bank-backend/api/cards/CardsService.ts";
	}])
	.controller('PageController', ['$scope', '$http', 'messageHub', 'entityApi', 'Extensions', function ($scope, $http, messageHub, entityApi, Extensions) {

		$scope.dataPage = 1;
		$scope.dataCount = 0;
		$scope.dataOffset = 0;
		$scope.dataLimit = 10;
		$scope.action = "select";

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'bank-backend-custom-action').then(function (response) {
			$scope.pageActions = response.filter(e => e.perspective === "cards" && e.view === "Cards" && (e.type === "page" || e.type === undefined));
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
		//-----------------Custom Actions-------------------//

		function refreshData() {
			$scope.dataReset = true;
			$scope.dataPage--;
		}

		function resetPagination() {
			$scope.dataReset = true;
			$scope.dataPage = 1;
			$scope.dataCount = 0;
			$scope.dataLimit = 10;
		}

		//-----------------Events-------------------//
		messageHub.onDidReceiveMessage("clearDetails", function (msg) {
			$scope.$apply(function () {
				$scope.selectedEntity = null;
				$scope.action = "select";
			});
		});

		messageHub.onDidReceiveMessage("entityCreated", function (msg) {
			refreshData();
			$scope.loadPage($scope.dataPage, $scope.filter);
		});

		messageHub.onDidReceiveMessage("entityUpdated", function (msg) {
			refreshData();
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
			if (!filter) {
				filter = {};
			}
			$scope.selectedEntity = null;
			entityApi.count(filter).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("Cards", `Unable to count Cards: '${response.message}'`);
					return;
				}
				if (response.data) {
					$scope.dataCount = response.data;
				}
				$scope.dataPages = Math.ceil($scope.dataCount / $scope.dataLimit);
				filter.$offset = ($scope.dataPage - 1) * $scope.dataLimit;
				filter.$limit = $scope.dataLimit;
				if ($scope.dataReset) {
					filter.$offset = 0;
					filter.$limit = $scope.dataPage * $scope.dataLimit;
				}

				entityApi.search(filter).then(function (response) {
					if (response.status != 200) {
						messageHub.showAlertError("Cards", `Unable to list/filter Cards: '${response.message}'`);
						return;
					}
					if ($scope.data == null || $scope.dataReset) {
						$scope.data = [];
						$scope.dataReset = false;
					}

					response.data.forEach(e => {
						if (e.ExpirationDate) {
							e.ExpirationDate = new Date(e.ExpirationDate);
						}
					});

					$scope.data = $scope.data.concat(response.data);
					$scope.dataPage++;
				});
			});
		};
		$scope.loadPage($scope.dataPage, $scope.filter);

		$scope.selectEntity = function (entity) {
			$scope.selectedEntity = entity;
			messageHub.postMessage("entitySelected", {
				entity: entity,
				selectedMainEntityId: entity.Id,
				optionsCardType: $scope.optionsCardType,
				optionsBankAccounts: $scope.optionsBankAccounts,
			});
		};

		$scope.createEntity = function () {
			$scope.selectedEntity = null;
			$scope.action = "create";

			messageHub.postMessage("createEntity", {
				entity: {},
				optionsCardType: $scope.optionsCardType,
				optionsBankAccounts: $scope.optionsBankAccounts,
			});
		};

		$scope.updateEntity = function () {
			$scope.action = "update";
			messageHub.postMessage("updateEntity", {
				entity: $scope.selectedEntity,
				optionsCardType: $scope.optionsCardType,
				optionsBankAccounts: $scope.optionsBankAccounts,
			});
		};

		$scope.deleteEntity = function () {
			let id = $scope.selectedEntity.Id;
			messageHub.showDialogAsync(
				'Delete Cards?',
				`Are you sure you want to delete Cards? This action cannot be undone.`,
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
							messageHub.showAlertError("Cards", `Unable to delete Cards: '${response.message}'`);
							return;
						}
						refreshData();
						$scope.loadPage($scope.dataPage, $scope.filter);
						messageHub.postMessage("clearDetails");
					});
				}
			});
		};

		$scope.openFilter = function (entity) {
			messageHub.showDialogWindow("Cards-filter", {
				entity: $scope.filterEntity,
				optionsCardType: $scope.optionsCardType,
				optionsBankAccounts: $scope.optionsBankAccounts,
			});
		};

		//----------------Dropdowns-----------------//
		$scope.optionsCardType = [];
		$scope.optionsBankAccounts = [];


		$http.get("/services/ts/bank-backend/gen/bank-backend/api/Settings/CardTypeService.ts").then(function (response) {
			$scope.optionsCardType = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$http.get("/services/ts/bank-backend/gen/bank-backend/api/bankAccount/BankAccountsService.ts").then(function (response) {
			$scope.optionsBankAccounts = response.data.map(e => {
				return {
					value: e.Id,
					text: e.IBAN
				}
			});
		});

		$scope.optionsCardTypeValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsCardType.length; i++) {
				if ($scope.optionsCardType[i].value === optionKey) {
					return $scope.optionsCardType[i].text;
				}
			}
			return null;
		};
		$scope.optionsBankAccountsValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsBankAccounts.length; i++) {
				if ($scope.optionsBankAccounts[i].value === optionKey) {
					return $scope.optionsBankAccounts[i].text;
				}
			}
			return null;
		};
		//----------------Dropdowns-----------------//

	}]);
