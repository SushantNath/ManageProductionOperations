/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"i2d/mpe/operations/manages2/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("i2d.mpe.operations.manages2.controller.NotFound", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onLinkPressed: function() {
			var sAppStateKey = this.getRouter().oHashChanger.getHash().split("/sap-iapp-state=")[1];                         
			this.getRouter().navTo("catchAll", {
				iAppState: sAppStateKey
			}, true);
		}

	});

});