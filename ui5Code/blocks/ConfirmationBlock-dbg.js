/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/uxap/BlockBase'],
	function(BlockBase) {
	"use strict";

	var ConfirmationBlock = BlockBase.extend("i2d.mpe.operations.manages1.blocks.ConfirmationBlock", {
	    metadata: {
	        views: {
	            Collapsed: {
	                viewName: "i2d.mpe.operations.manages1.blocks.ConfirmationBlock",
	                type: "XML"
	            },
	            Expanded: {
	                viewName: "i2d.mpe.operations.manages1.blocks.ConfirmationBlock",
	                type: "XML"
	            }
	        }
	    }
	});
	return ConfirmationBlock;
});