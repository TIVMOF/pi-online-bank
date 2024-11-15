angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.bankAccount.BankAccounts';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/pi-bank-backend/gen/pi-bank-backend/api/bankAccount/BankAccountsService.ts";
	}])
	.controller('PageController', ['$scope', '$http', 'messageHub', 'entityApi', 'Extensions', function ($scope, $http, messageHub, entityApi, Extensions) {

		$scope.dataPage = 1;
		$scope.dataCount = 0;
		$scope.dataOffset = 0;
		$scope.dataLimit = 10;
		$scope.action = "select";

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'pi-bank-backend-custom-action').then(function (response) {
			$scope.pageActions = response.filter(e => e.perspective === "bankAccount" && e.view === "BankAccounts" && (e.type === "page" || e.type === undefined));
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
					messageHub.showAlertError("BankAccounts", `Unable to count BankAccounts: '${response.message}'`);
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
						messageHub.showAlertError("BankAccounts", `Unable to list/filter BankAccounts: '${response.message}'`);
						return;
					}
					if ($scope.data == null || $scope.dataReset) {
						$scope.data = [];
						$scope.dataReset = false;
					}

					response.data.forEach(e => {
						if (e.CreationDate) {
							e.CreationDate = new Date(e.CreationDate);
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
				optionsUsers: $scope.optionsUsers,
				optionsCurrency: $scope.optionsCurrency,
				optionsBankAccountType: $scope.optionsBankAccountType,
				optionsBankAccountStatus: $scope.optionsBankAccountStatus,
			});
		};

		$scope.createEntity = function () {
			$scope.selectedEntity = null;
			$scope.action = "create";

			messageHub.postMessage("createEntity", {
				entity: {},
				optionsUsers: $scope.optionsUsers,
				optionsCurrency: $scope.optionsCurrency,
				optionsBankAccountType: $scope.optionsBankAccountType,
				optionsBankAccountStatus: $scope.optionsBankAccountStatus,
			});
		};

		$scope.updateEntity = function () {
			$scope.action = "update";
			messageHub.postMessage("updateEntity", {
				entity: $scope.selectedEntity,
				optionsUsers: $scope.optionsUsers,
				optionsCurrency: $scope.optionsCurrency,
				optionsBankAccountType: $scope.optionsBankAccountType,
				optionsBankAccountStatus: $scope.optionsBankAccountStatus,
			});
		};

		$scope.deleteEntity = function () {
			let id = $scope.selectedEntity.Id;
			messageHub.showDialogAsync(
				'Delete BankAccounts?',
				`Are you sure you want to delete BankAccounts? This action cannot be undone.`,
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
							messageHub.showAlertError("BankAccounts", `Unable to delete BankAccounts: '${response.message}'`);
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
			messageHub.showDialogWindow("BankAccounts-filter", {
				entity: $scope.filterEntity,
				optionsUsers: $scope.optionsUsers,
				optionsCurrency: $scope.optionsCurrency,
				optionsBankAccountType: $scope.optionsBankAccountType,
				optionsBankAccountStatus: $scope.optionsBankAccountStatus,
			});
		};

		//----------------Dropdowns-----------------//
		$scope.optionsUsers = [];
		$scope.optionsCurrency = [];
		$scope.optionsBankAccountType = [];
		$scope.optionsBankAccountStatus = [];


		$http.get("/services/ts/pi-bank-backend/gen/pi-bank-backend/api/users/UsersService.ts").then(function (response) {
			$scope.optionsUsers = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Username
				}
			});
		});

		$http.get("/services/ts/codbex-currencies/gen/codbex-currencies/api/Currencies/CurrencyService.ts").then(function (response) {
			$scope.optionsCurrency = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Code
				}
			});
		});

		$http.get("/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/BankAccountTypeService.ts").then(function (response) {
			$scope.optionsBankAccountType = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$http.get("/services/ts/pi-bank-backend/gen/pi-bank-backend/api/Settings/BankAccountStatusService.ts").then(function (response) {
			$scope.optionsBankAccountStatus = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$scope.optionsUsersValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsUsers.length; i++) {
				if ($scope.optionsUsers[i].value === optionKey) {
					return $scope.optionsUsers[i].text;
				}
			}
			return null;
		};
		$scope.optionsCurrencyValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsCurrency.length; i++) {
				if ($scope.optionsCurrency[i].value === optionKey) {
					return $scope.optionsCurrency[i].text;
				}
			}
			return null;
		};
		$scope.optionsBankAccountTypeValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsBankAccountType.length; i++) {
				if ($scope.optionsBankAccountType[i].value === optionKey) {
					return $scope.optionsBankAccountType[i].text;
				}
			}
			return null;
		};
		$scope.optionsBankAccountStatusValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsBankAccountStatus.length; i++) {
				if ($scope.optionsBankAccountStatus[i].value === optionKey) {
					return $scope.optionsBankAccountStatus[i].text;
				}
			}
			return null;
		};
		//----------------Dropdowns-----------------//

	}]);
