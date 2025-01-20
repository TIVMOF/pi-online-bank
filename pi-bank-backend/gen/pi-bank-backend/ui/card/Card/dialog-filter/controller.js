angular.module('page', ["ideUI", "ideView"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'pi-bank-backend.card.Card';
	}])
	.controller('PageController', ['$scope', 'messageHub', 'ViewParameters', function ($scope, messageHub, ViewParameters) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};

		let params = ViewParameters.get();
		if (Object.keys(params).length) {
			if (params?.entity?.ExpirationDateFrom) {
				params.entity.ExpirationDateFrom = new Date(params.entity.ExpirationDateFrom);
			}
			if (params?.entity?.ExpirationDateTo) {
				params.entity.ExpirationDateTo = new Date(params.entity.ExpirationDateTo);
			}
			$scope.entity = params.entity ?? {};
			$scope.selectedMainEntityKey = params.selectedMainEntityKey;
			$scope.selectedMainEntityId = params.selectedMainEntityId;
			$scope.optionsCardType = params.optionsCardType;
			$scope.optionsBankAccount = params.optionsBankAccount;
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
			if (entity.CardNumber) {
				filter.$filter.contains.CardNumber = entity.CardNumber;
			}
			if (entity.ExpirationDateFrom) {
				filter.$filter.greaterThanOrEqual.ExpirationDate = entity.ExpirationDateFrom;
			}
			if (entity.ExpirationDateTo) {
				filter.$filter.lessThanOrEqual.ExpirationDate = entity.ExpirationDateTo;
			}
			if (entity.CardType !== undefined) {
				filter.$filter.equals.CardType = entity.CardType;
			}
			if (entity.BankAccount !== undefined) {
				filter.$filter.equals.BankAccount = entity.BankAccount;
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
			messageHub.closeDialogWindow("Card-filter");
		};

		$scope.clearErrorMessage = function () {
			$scope.errorMessage = null;
		};

	}]);