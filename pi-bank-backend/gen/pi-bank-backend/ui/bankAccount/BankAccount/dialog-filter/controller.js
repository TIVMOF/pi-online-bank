angular.module('page', ["ideUI", "ideView"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.bankAccount.BankAccount';
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
			$scope.optionsUser = params.optionsUser;
			$scope.optionsCurrency = params.optionsCurrency;
			$scope.optionsType = params.optionsType;
			$scope.optionsStatus = params.optionsStatus;
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
			if (entity.IBAN) {
				filter.$filter.contains.IBAN = entity.IBAN;
			}
			if (entity.User !== undefined) {
				filter.$filter.equals.User = entity.User;
			}
			if (entity.Amount !== undefined) {
				filter.$filter.equals.Amount = entity.Amount;
			}
			if (entity.Currency !== undefined) {
				filter.$filter.equals.Currency = entity.Currency;
			}
			if (entity.Type !== undefined) {
				filter.$filter.equals.Type = entity.Type;
			}
			if (entity.Status !== undefined) {
				filter.$filter.equals.Status = entity.Status;
			}
			if (entity.CreationDateFrom) {
				filter.$filter.greaterThanOrEqual.CreationDate = entity.CreationDateFrom;
			}
			if (entity.CreationDateTo) {
				filter.$filter.lessThanOrEqual.CreationDate = entity.CreationDateTo;
			}
			messageHub.postMessage("entitySearch", {
				entity: entity,
				filter: filter
			});
			messageHub.postMessage("clearDetails");
			$scope.cancel();
		};

		$scope.resetFilter = function () {
			$scope.entity = {};
			$scope.filter();
		};

		$scope.cancel = function () {
			messageHub.closeDialogWindow("BankAccount-filter");
		};

		$scope.clearErrorMessage = function () {
			$scope.errorMessage = null;
		};

	}]);