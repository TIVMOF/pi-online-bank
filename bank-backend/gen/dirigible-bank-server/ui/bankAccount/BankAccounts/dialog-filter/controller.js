angular.module('page', ["ideUI", "ideView"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'dirigible-bank-server.bankAccount.BankAccounts';
	}])
	.controller('PageController', ['$scope', 'messageHub', 'ViewParameters', function ($scope, messageHub, ViewParameters) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};

		let params = ViewParameters.get();
		if (Object.keys(params).length) {
			if (params?.entity?.CreationDateFrom) {
				params.entity.CreationDateFrom = new Date(params.entity.CreationDateFrom);
			}
			if (params?.entity?.CreationDateTo) {
				params.entity.CreationDateTo = new Date(params.entity.CreationDateTo);
			}
			$scope.entity = params.entity ?? {};
			$scope.selectedMainEntityKey = params.selectedMainEntityKey;
			$scope.selectedMainEntityId = params.selectedMainEntityId;
			$scope.optionsUsers = params.optionsUsers;
			$scope.optionsBankAccountType = params.optionsBankAccountType;
			$scope.optionsBankAccountStatus = params.optionsBankAccountStatus;
			$scope.optionsCurrency = params.optionsCurrency;
		}

		$scope.filter = function () {
			let entity = $scope.entity;
			const filter = {
				$filter: {
					equals: {
					},
					notEquals: {
					},
					contains: {
					},
					greaterThan: {
					},
					greaterThanOrEqual: {
					},
					lessThan: {
					},
					lessThanOrEqual: {
					}
				},
			};
			if (entity.Id !== undefined) {
				filter.$filter.equals.Id = entity.Id;
			}
			if (entity.Amount !== undefined) {
				filter.$filter.equals.Amount = entity.Amount;
			}
			if (entity.IBAN) {
				filter.$filter.contains.IBAN = entity.IBAN;
			}
			if (entity.Users !== undefined) {
				filter.$filter.equals.Users = entity.Users;
			}
			if (entity.BankAccountType !== undefined) {
				filter.$filter.equals.BankAccountType = entity.BankAccountType;
			}
			if (entity.BankAccountStatus !== undefined) {
				filter.$filter.equals.BankAccountStatus = entity.BankAccountStatus;
			}
			if (entity.CreationDateFrom) {
				filter.$filter.greaterThanOrEqual.CreationDate = entity.CreationDateFrom;
			}
			if (entity.CreationDateTo) {
				filter.$filter.lessThanOrEqual.CreationDate = entity.CreationDateTo;
			}
			if (entity.Currency !== undefined) {
				filter.$filter.equals.Currency = entity.Currency;
			}
			messageHub.postMessage("entitySearch", {
				entity: entity,
				filter: filter
			});
			$scope.cancel();
		};

		$scope.resetFilter = function () {
			$scope.entity = {};
			$scope.filter();
		};

		$scope.cancel = function () {
			messageHub.closeDialogWindow("BankAccounts-filter");
		};

		$scope.clearErrorMessage = function () {
			$scope.errorMessage = null;
		};

	}]);