/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/odata/type/Time",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function (Time, DateFormat, NumberFormat) {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			// return parseFloat(sValue).toFixed(2);
			return parseFloat(sValue);
		},

		// UTC conversion to avoid date change because of time zone and time differences
		formatDateTimeUTC: function (oDate) {

			var newDate = DateFormat.getDateTimeInstance({
				pattern: "EEE, MMM d",
				UTC: true
			}).format(oDate);

			return newDate;
		},

		/*
		 *To remove fields
		 * @param {string} sText
		 * @return text within brackets
		 */

		removeField: function (sField) {
			if (!sField) {
				return false;
			}
		},

		/*
		 *To show/hide icons
		 */

		setHoldIconVisibility: function (MfgFeatureIsActiveInAnyPlant) {
			if (MfgFeatureIsActiveInAnyPlant === "X" || MfgFeatureIsActiveInAnyPlant === true) {
				return true;
			} else {
				return false;
			}
		},

		/*
		 *To have the text within brackets
		 * @param {string} sText
		 * @return text within brackets
		 */

		getWordInBrackets: function (sText) {
			if (sText) {
				return "(" + sText + ")";
			}
		},

		/*
		 *Removing Leading Zeroes from the material text
		 */
		removeLeadingZeros: function (sMaterial) {
			sMaterial = sMaterial.replace(/^0+/, '');
			return sMaterial;
		},

		/*
		 * returns date of the required format, if Actual, then return actual else return scheduled
		 * @param {Date} sScheduled
		 * @param {Date} sActual
		 * @returns {Date} formatted date
		 */
		DatePriority: function (sScheduled, sActual) {
			var oDateFormat;
			if (sActual) {
				oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "EEE, MMM d",
					UTC: true
				});
				return oDateFormat.format(new Date(sActual));
			} else {
				oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "EEE, MMM d",
					UTC: true
				});
				return oDateFormat.format(new Date(sScheduled));
			}
		},
		/*
		 * To get the time in the required format
		 * differentiate between actual and scheduled time and return the value along with the text.
		 * @param {Date} sScheduledDate,sActualDate
		 * @param {Time} sScheduledTime,sActualTime
		 * @return {Time(string)} which gives the formatted time if it is actual/scheduled time
		 */
		TimePriority: function (sScheduledDate, sActualDate, sScheduledTime, sActualTime) {

			var time = null;
			var sTimeStr = null;
			if (sActualDate) {
				time = new Time({
					style: 'short',
					relativeScale: 'auto',
					UTC: true
				});
				sTimeStr = time.formatValue(sActualTime, "string");

				return sTimeStr;
			} else {
				time = new Time({
					style: 'short',
					relativeScale: 'auto',
					UTC: true
				});
				sTimeStr = time.formatValue(sScheduledTime, "string");
				return sTimeStr;

			}
		},

		/*
		 * returns text if Actual, then return actual else return scheduled
		 * @param {Date} sScheduled
		 * @param {Date} sActual
		 * @returns {String} Text
		 */
		textBasedonDate: function (sScheduled, sActual) {
			var sResult = this.formatter.textCodeBasedonDate(sScheduled, sActual);
			var sResultText = this.getModel("i18n").getProperty(sResult);
			return this.getModel("i18n").getResourceBundle().getText("LABEL_WITH_COLON", [sResultText]);
		},

		textCodeBasedonDate: function (sScheduled, sActual) {
			if (sActual) {
				return "Actual";
			} else {
				return "Scheduled";
			}
		},

		/*
		 * returns visible flag if Actual, then return false else return true
		 * @param {Date} sScheduled
		 * @param {Date} sActual
		 * @returns {String} visible flag
		 */
		iconBasedonDate: function (sScheduled, sActual) {
			if (sActual) {
				return false;
			} else {
				return true;
			}
		},

		/*
		 * set the object page layout & controller as a reference
		 * @param {object} oObjectPageLayout , oObjcetController
		 */
		setOperationDetailPageReferences: function (oObjectPageLayout, oObjcetController) {
			this.oObjectPageLayoutinstance = oObjectPageLayout;
			this.oObjcetPageController = oObjcetController;
		},
		/*
		 * get the object page layout 
		 * @return {object} oObjectPageLayout
		 */
		getObjectPageLayoutReference: function () {
			return this.oObjectPageLayoutinstance;
		},
		/*
		 * get the object page layout 
		 * @return {object} oObjectPageController
		 */

		getObjectPageControllerReference: function () {
			return this.oObjcetPageController;
		},
		/*
		 *Based on flag value,passed yes or no
		 *@param {string} sFinalConfirmation
		 *@retun {string} Yes or No
		 */
		finalConfirmation: function (sFinalConfirmation) {
			var sFinalConfirmationText = this.formatter.finalConfirmationText(sFinalConfirmation);
			return this.getI18NCommonText(sFinalConfirmationText);
		},
		finalConfirmationText: function (sFinalConfirmation) {
			if (sFinalConfirmation === "X") {
				return "Yes";
			} else {
				return "No";
			}
		},
		/*
		 * sets the state of the progress indicator
		 * @param {string} OpExecutionEndIsLate 
		 * @param {string} OpExecutionStartIsLate 
		 * @returns {string} based on the parameters
		 */
		setProgressIndicatorState: function (OpExecutionEndIsLate, OpExecutionStartIsLate) {
			if (OpExecutionEndIsLate || OpExecutionStartIsLate) {
				return "Warning";
			} else {
				return "Success";
			}
		},

		/*
		 * Calculate the percenatge value
		 * @param {string} ConfirmedYieldQty
		 * @param {string} PlannedTotalQty
		 * @returns {string} which gives the percentage.
		 */
		percentValue: function (ConfirmedYieldQty, PlannedTotalQty) {
			if (PlannedTotalQty < ConfirmedYieldQty) {
				return 100;
			} else if (PlannedTotalQty !== "0") {
				return ((ConfirmedYieldQty / PlannedTotalQty) * 100);
			}
		},
		/*
		 *Based on the status, pass true or false
		 * @param {string} sStatus
		 * @return {boolean} true or false
		 */

		setEnableStatus: function (iStatus, iOrderIsShopFloorOrder) {
			if (iOrderIsShopFloorOrder === 'X') {
				return false;
			}
			if (iStatus === 3 || iStatus === 4 || iStatus === "03" || iStatus === "04") {
				return true;
			} else {
				return false;
			}
		},

		/*
		 *Return Negative based on hold flag
		 *@param {string} OperationHasProductionHold
		 *@return {string} color codes in hexa
		 */
		setOperationHoldIssueIconColor: function (OperationHasProductionHold) {
			if (OperationHasProductionHold) {
				return "Negative";
			} else {
				return "Default";
			}
		},

		/*
		 *Return operation is confirmed, if  OperationIsConfirmed = X, else return operation is not confirmed
		 *@param {string} OperationIsConfirmed
		 *@return {string} color codes in hexa
		 */
		setOperationIsConfirmedText: function (OperationIsConfirmed) {
			if (OperationIsConfirmed) {
				var sOpCnfr = this.getI18NText("operationIsConfirmed");
				return sOpCnfr;
			} else {
				var sOpNotCnfr = this.getI18NText("operationIsNotConfirmed");
				return sOpNotCnfr;
			}
		},

		/*
		 *Return Negative based on flag values
		 *@param {string} OperationExecutionStartIsLate,OperationExecutionEndIsLate
		 *@return {string} color codes in hexa
		 */
		setDelayIconColor: function (OperationExecutionStartIsLate, OperationExecutionEndIsLate) {
			if (OperationExecutionEndIsLate || OperationExecutionStartIsLate) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		/*
		 *Return Negative based on flag values
		 *@param {string} OperationYieldDeviationQty
		 *@return {string} color codes in hexa
		 */
		setMissingQuantityIconColor: function (OperationYieldDeviationQty) {
			if (OperationYieldDeviationQty < 0) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		/*
		 *Return Negative based on flag values
		 *@param {string} OperationMissingComponents
		 *@return {string} color codes in hexa
		 */
		setMissingComponentIconColor: function (OperationMissingComponents) {
			if (OperationMissingComponents) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		/*
		 *Return Negative based on flag values
		 *@param {string} sOpScrapQualityIssue
		 *@param {string} sInspHasRejectedCharc
		 *@param {string} sInspHasRejectedInspSubset
		 *@param {string} sInspHasRejectedInspLot
		 *@return {string} color codes in hexa
		 */
		setMissingQualityIssueIconColor: function (sOpScrapQualityIssue, sInspHasRejectedCharc, sInspHasRejectedInspSubset,
			sInspHasRejectedInspLot) {
			if (sOpScrapQualityIssue === "X" || sInspHasRejectedCharc === "X" || sInspHasRejectedInspSubset === "X" || sInspHasRejectedInspLot ===
				"X") {
				return "Negative";
			} else {
				return "Default";
			}
		},

		getStatusText: function (iStatus) {
			var sStatusCodeText = this.formatter.getStatusTextCode(iStatus);
			return this.getI18NText(sStatusCodeText);
		},

		getStatusTextCode: function (iStatus) {
			if (iStatus === "01") {
				return "status_created";
			} else if (iStatus === "02") {
				return "status_scheduled";
			} else if (iStatus === "03") {
				return "status_released";
			} else if (iStatus === "04") {
				return "status_partConfirmed";
			} else if (iStatus === "05") {
				return "status_confirmed";
			} else if (iStatus === "06") {
				return "status_partdelivered";
			} else if (iStatus === "07") {
				return "status_delivered";
			} else if (iStatus === "08") {
				return "status_techCompleted";
			} else if (iStatus === "09") {
				return "status_closed";
			} else if (iStatus === "10") {
				return "status_deleted";
			}
		},

		setPercentValue: function (sPercentValue) {
			return parseInt(sPercentValue);
		},

		/*
		 *To have the text within brackets
		 * @param {string} sDescription
		 * @param {string} sId
		 * @return text within brackets or just the available value
		 */
		getCombineDescriptionWithId: function (sDescription, sId) {
			if (sId && !sDescription) {
				return sId;
			} else if (sDescription && sId) {
				return sDescription + " (" + sId + ")";
			} else if (sDescription && !sId) {
				return sDescription;
			}
		},

		getOperationLinkText: function (sOperation, sOperationText) {
			var sOpText;
			if (sOperationText) {
				sOpText = this.getI18NText("OperationsPopoverLink", [sOperationText, sOperation]);
			} else {
				sOpText = sOperation;
			}
			return sOpText;
		},

		addColon: function (sText) {
			var sLabel;
			if (sText) {
				sLabel = this.getModel("i18n").getResourceBundle().getText("LABEL_WITH_COLON", [sText]);
			} else {
				sLabel = '';
			}
			return sLabel;
		},

		setEnableStatusRelease: function (sStatus) {
			if (sStatus === "01" || sStatus === "02") {
				return true;
			} else {
				return false;
			}
		},

		setEnableHoldButton: function (sManufacturingFeature, sManufacturingFeatureIsActive, sStatus) {
			if (sManufacturingFeature === "EPO" && sManufacturingFeatureIsActive === "X") {
				if (sStatus === "05" || sStatus === "07" || sStatus === "08" || sStatus === "09" || sStatus === "10") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},

		getHoldButtonStatus: function (oProperty) {
			if (oProperty.ManufacturingFeature === "EPO" && oProperty.ManufacturingFeatureIsActive === "X" && oProperty.OrderIsShopFloorOrder) {
				if (oProperty.OperationIsConfirmed === "X" || oProperty.OperationIsDelivered === "X" || oProperty.OperationIsClosed === "X" ||
					oProperty.OperationIsTechlyCompleted === "X" || oProperty.OperationIsDeleted === "X") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},

		isOperationChangePossible: function (oProperty) {
			if (oProperty.ManufacturingFeature === "EPO" && oProperty.ManufacturingFeatureIsActive === "X" && oProperty.OrderIsShopFloorOrder) {
				if (oProperty.OperationIsConfirmed === "X" || oProperty.OperationIsDelivered === "X" || oProperty.OperationIsClosed === "X" ||
					oProperty.OperationIsTechlyCompleted === "X" || oProperty.OperationIsDeleted === "X" || oProperty.OperationIsPartiallyConfirmed ===
					"X") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},

		progressDisplayValue: function (ActValue, TotalValue) {
			var sDisplayText;
			if (!this.getI18NText) {
				sDisplayText = this.getView().getModel("i18n").getResourceBundle().getText("ProgressText", [ActValue, TotalValue]);
			} else {
				sDisplayText = this.getI18NText("ProgressText", [ActValue, TotalValue]);
			}
			return sDisplayText;
		},

		activityProgressDisplayValue: function (ConfirmationYieldQuantity, OperationExecutionAvailableQty, ProductionUnit) {
			var sDisplayText;
			if (!this.getI18NText) {
				sDisplayText = this.getView().getModel("i18n").getResourceBundle().getText("ActivitiesProgressText", [ConfirmationYieldQuantity,
					parseFloat(ConfirmationYieldQuantity) + parseFloat(OperationExecutionAvailableQty), ProductionUnit
				]);
			} else {
				sDisplayText = this.getI18NText("ActivitiesProgressText", [ConfirmationYieldQuantity, parseFloat(ConfirmationYieldQuantity) +
					parseFloat(OperationExecutionAvailableQty), ProductionUnit
				]);
			}
			return sDisplayText;
		},

		setActivityProgressPercentValue: function (ConfirmationYieldQuantity, OperationExecutionAvailableQty) {
			return 100 * parseFloat(ConfirmationYieldQuantity) / (parseFloat(ConfirmationYieldQuantity) + parseFloat(
				OperationExecutionAvailableQty));
		},

		formatTextWithBrackets: function (sValue1, sValue2) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			if (sValue2 && sValue2 !== "") {
				return resourceBundle.getText("TUPEL_WITH_BRACKETS", [sValue1, sValue2]);
			} else {
				return sValue1;
			}
		},

		/**
		 * Format SFI status criticallity (Success,Error,Warning and None)
		 * @public
		 * @param {integer} iValue can be  0-inactive, 1-red, 2-yellow, 3-green
		 * @returns {string} sValue - criticallity state value from enumeration of sap.ui.core.ValueState 
		 */
		/*formatStatusCriticality: function(iValue) {
			if (Number(iValue) === 3) {
				return sap.ui.core.ValueState.Warning;
			} else if (Number(iValue) === 2) {
				return sap.ui.core.ValueState.Success;
			} else if (Number(iValue) === 1) {
				return sap.ui.core.ValueState.Success;
			} else {
				return sap.ui.core.ValueState.None;
			}
		},*/

		formatQtyWithUnit: function (sQuantity, sUnitOfMeasure) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			var sOpQty = parseFloat(sQuantity);
			if (!sQuantity && sQuantity !== 0) {
				return "";
			} else if (sUnitOfMeasure) {
				return resourceBundle.getText("TUPEL_WITH_BLANK", [sOpQty, sUnitOfMeasure]);
			} else {
				return sOpQty;
			}
		},

		formatIconColor: function (iCriticality) {
			switch (iCriticality) {
			case 0:
				return "Neutral";
			case 1:
				return "Negative";
			case 2:
				return "Critical";
			case 3:
				return "Positive";
			default:
				return "";
			}
		},

		getScanStatusText: function (iCriticality, bBlackFlushed) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			if (!bBlackFlushed) {
				switch (iCriticality) {
				case 0:
					return resourceBundle.getText("scanStatusGrey");
				case 1:
					return resourceBundle.getText("scanStatusRed");
				case 2:
					return resourceBundle.getText("scanStatusYellow");
				case 3:
					return resourceBundle.getText("scanStatusGreen");
				default:
					return "";
				}
			} else {
				return "";
			}
		},

		formatSerialNrStatus: function (oStatusObj) {
			var oModel = this.getModel();
			var b = oModel.oData;
			return b[oStatusObj[0]].SASStatusName;
		},

		/*
		 *To show/hide icons
		 */

		getFeatureAvailability: function (MfgFeatureIsActiveInAnyPlant) {
			if (MfgFeatureIsActiveInAnyPlant === "X" || MfgFeatureIsActiveInAnyPlant === true) {
				return true;
			} else {
				return false;
			}
		},

		/** 
		 * Concatenate the URL for a document
		 * @param {object} oDocument Reference to a file of document
		 * @returns {string} URL of document
		 */
		getURLForDocument: function (oDocument) {
			return "/sap/opu/odata/sap/CV_ATTACHMENT_SRV/OriginalContentSet(" +
				"Documenttype='" + oDocument.Documenttype + "'," +
				"Documentnumber='" + oDocument.Documentnumber + "'," +
				"Documentpart='" + oDocument.Documentpart + "'," +
				"Documentversion='" + oDocument.Documentversion + "'," +
				"ApplicationId='" + oDocument.ApplicationId + "'," +
				"FileId='" + oDocument.FileId + "')/$value";
		}
	};

});