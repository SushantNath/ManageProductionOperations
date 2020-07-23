/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/uxap/BlockBase"],
	function(BlockBase) {
	"use strict";

	var ActivitiesBlock = BlockBase.extend("i2d.mpe.operations.manages2.blocks.ActivitiesBlock", {
	    metadata: {
	        views: {
	            Collapsed: {
	                viewName: "i2d.mpe.operations.manages2.blocks.ActivitiesBlock",
	                type: "XML"
	            },
	            Expanded: {
	                viewName: "i2d.mpe.operations.manages2.blocks.ActivitiesBlock",
	                type: "XML"
	            }
	        }
	    }
	});
	return ActivitiesBlock;
});