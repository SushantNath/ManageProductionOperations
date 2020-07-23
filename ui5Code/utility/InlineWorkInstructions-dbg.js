/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageToast"
], function(UI5Object, MessageToast) {
	"use strict";

	return UI5Object.extend("i2d.mpe.operations.manages2.utility.InlineWorkInstructions", {
		/* =========================================================== */
		/* Work Instructions Editor methods                            */
		/* =========================================================== */
		constructor: function(oParentContext) {
			//Instantiate the reusable component
			this._oParentContext = oParentContext;
			this._inlineWiComponentInstance = undefined;
		},

		enableInlineEditor: function(bGrayOutResutlRecordingFields) {
			var componentInstance = this.getInlineWorkInstructionComponentInstance();
			if (componentInstance) {
				this.getInlineWorkInstructionComponentInstance().enableInlineEditor(bGrayOutResutlRecordingFields);
			}
		},

		getInlineWorkInstructionComponentInstance: function() {

			if (this._inlineWiComponentInstance === undefined) {
				this._inlineWiComponentInstance = this._oParentContext.byId("inlineWorkInstructions").getComponentInstance();
			}
			return this._inlineWiComponentInstance;
		},

		_forwardInfosToReuseComponent: function(oBindingContext) {

			var oWIComp = this.getInlineWorkInstructionComponentInstance();
			oWIComp.forwardBindingContext(oBindingContext);

		},
		instantiateReuseComponent: function(sHtmlContent) {

			if (this._inlineWorkInstructions === undefined) {

				var htmlContent = sHtmlContent;
				this._inlineWorkInstructions = sap.ui.getCore().createComponent({
					name: "sap.i2d.mpe.lib.workinstructions1.inlineReuse.forFreeStyle",
					settings: {
						content: htmlContent,
						interactive: false,
						height: "45rem"
					}
				});

				var id = this._oParentContext.createId("inlineWorkInstructions");
				var rte = sap.ui.getCore().byId(id);
				rte.setComponent(this._inlineWorkInstructions);
			} else {
				this._inlineWorkInstructions.setContent(sHtmlContent);
			}

		},

		_initializeInlineEditingModel: function() {

			var _ResultRecordingModel = this._oParentContext.getModel("RESULTRECORDING");
			var _compRefModel = this._oParentContext.getModel("mSFIComponents");
			var oBindingContextObject = this._oParentContext.getView().getBindingContext().getObject();
			var oDataModel = this._oParentContext.getModel();
			var oCompModel = this._oParentContext.getModel();
			var isActivityStarted = false;
			this._forwardInfosToReuseComponent(oBindingContextObject); // forward the binding context to reuse component instance 
			this._inlineWorkInstructions.initializeResultRecording(_ResultRecordingModel, _compRefModel, oDataModel, oCompModel,
				isActivityStarted);
		}

	});
});