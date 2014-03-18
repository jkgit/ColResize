/*! ColResize 1.1.0
 * ©2010-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     ColResize
 * @description Provide the ability to reorder columns in a DataTable
 * @version     1.1.0
 * @file        dataTables.ColResize.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2010-2014 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

(function(window, document, undefined) {

	
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables plug-in API functions
 *
 * This are required by ColResize in order to perform the tasks required, and also keep this
 * code portable, to be used for other column resizing projects with DataTables, if needed.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



/**
 * Plug-in for DataTables which will resize the internal column structure.
 * 
 *  @method  $.fn.dataTableExt.oApi.fnColResize
 *  @param   object oSettings DataTables settings object - automatically added by DataTables!
 *  @param   int iCol Take the column to be repositioned from this point
 *  @param   int newSize and change its size to newSize
 *  @returns void
 */
$.fn.dataTableExt.oApi.fnColResize = function ( oSettings, iCol, iSize )
{
	var v110 = $.fn.dataTable.Api ? true : false;
	var i, iLen, j, jLen, iCols=oSettings.aoColumns.length, nTrs, oCol;

	var originalWidth = oSettings.aoColumns[iCol].sWidth;
	
	/* Sanity check in the input */
	if ( iSize == originalWidth )
	{
		/* Pointless resize */
		return;
	}

	if ( iCol < 0 || iCol >= iCols )
	{
		this.oApi._fnLog( oSettings, 1, "ColResize 'column' index is out of bounds: "+iCol );
		return;
	}
	
	/* Size the internal column setting first */
	var aoColumn=oSettings.aoColumns[iCol];
	aoColumn.sWidth=iSize;
	
	/*
	 * Size the DOM sizing elements regardless of whether they are visible or not.
	 */
	var nTh = aoColumn.nTh;
	$(nTh).width(iSize);

	/* Fire an event so other plug-ins can update */
	$(oSettings.oInstance).trigger( 'column-resize', [ oSettings, {
		"iCol": iCol,
		"iSize": iSize
	} ] );
};


var factory = function( $, DataTable ) {
"use strict";

/**
 * ColResize provides column size control for DataTables
 * @class ColResize
 * @constructor
 * @param {object} dt DataTables settings object
 * @param {object} opts ColResize options
 */
var ColResize = function( dt, opts )
{
	var oDTSettings;

	if ( $.fn.dataTable.Api ) {
		oDTSettings = new $.fn.dataTable.Api( dt ).settings()[0];
	}
	// 1.9 compatibility
	else if ( dt.fnSettings ) {
		// DataTables object, convert to the settings object
		oDTSettings = dt.fnSettings();
	}
	else if ( typeof dt === 'string' ) {
		// jQuery selector
		if ( $.fn.dataTable.fnIsDataTable( $(dt)[0] ) ) {
			oDTSettings = $(dt).eq(0).dataTable().fnSettings();
		}
	}
	else if ( dt.nodeName && dt.nodeName.toLowerCase() === 'table' ) {
		// Table node
		if ( $.fn.dataTable.fnIsDataTable( dt.nodeName ) ) {
			oDTSettings = $(dt.nodeName).dataTable().fnSettings();
		}
	}
	else if ( dt instanceof jQuery ) {
		// jQuery object
		if ( $.fn.dataTable.fnIsDataTable( dt[0] ) ) {
			oDTSettings = dt.eq(0).dataTable().fnSettings();
		}
	}
	else {
		// DataTables settings object
		oDTSettings = dt;
	}

	// Convert from camelCase to Hungarian, just as DataTables does
	if ( $.fn.dataTable.camelToHungarian ) {
		$.fn.dataTable.camelToHungarian( ColResize.defaults, opts || {} );
	}


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public class variables
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * @namespace Settings object which contains customisable information for ColResize instance
	 */
	this.s = {
		/**
		 * DataTables settings object
		 *  @property dt
		 *  @type     Object
		 *  @default  null
		 */
		"dt": null,

		/**
		 * Initialisation object used for this instance
		 *  @property init
		 *  @type     object
		 *  @default  {}
		 */
		"init": $.extend( true, {}, ColResize.defaults, opts ),

		/**
		 * @namespace Information used for the mouse drag
		 */
		"mouse": {
			"startX": -1,
			"startY": -1,
			"offsetX": -1,
			"offsetY": -1,
			"target": -1,
			"targetIndex": -1,
			"fromIndex": -1
		},

		/**
		 * Information which is used for positioning the insert cusor and knowing where to do the
		 * insert. Array of objects with the properties:
		 *   x: x-axis position
		 *   to: insert point
		 *  @property aoTargets
		 *  @type     array
		 *  @default  []
		 */
		"aoTargets": [],
		
		/**
         * Minimum width for columns (in pixels)
         * Default is 10. If set to 0, columns can be resized to nothingness.
         * @property minResizeWidth
         * @type     integer
         * @default  10
         */
         "minResizeWidth": 10,

         /**
         * Method to use for dealing with change in column size.  Choices are :
         *  greedy - as column gets bigger, take space from the neighbor, eventually push the table wider
         *  layout - set table-layout to fixed and width to auto, let browser expand the grid.
         *  		 layout should be faster than setting the width of the table ourselves
         *  table - add width to the parent table as column gets larger. should work like layout but
         *  		 a little slower 
         * 
         * @property resizeStyle
         * @type     string
         * @default  greedy
         */
         "resizeStyle": "greedy",


         /**
         * Callback called after each time the table is resized
         * This could be multiple times on one mouse move.
         * useful for resizing a containing element.
         * Passed the table element, th element, and the size change
         * @property fnResizeTableCallback
         * @type     function
         * @default  function(table, newSize, sizeChange) {}
         */
         "fnResizeTableCallback": function(){}

	};


	/**
	 * @namespace Common and useful DOM elements for the class instance
	 */
	this.dom = {
		/**
		 * Resizing a column
		 *  @property drag
		 *  @type     element
		 *  @default  null
		 */
	    "resize": null
	};


	/* Constructor logic */
	this.s.dt = oDTSettings.oInstance.fnSettings();
	this.s.dt._ColResize = this;
	this._fnConstruct();

	/* Add destroy callback */
	oDTSettings.oApi._fnCallbackReg(oDTSettings, 'aoDestroyCallback', $.proxy(this._fnDestroy, this), 'ColResize');

	/* Resize specific logic */

	/* Store the table size */
    this.table_size = -1;
    
    /* Store the header scrollHeadTableHeadRow so we only have to find it once */
    this.scrollHeadTableHeadRow=null;
    
	/* Store the scrollBodyTableHeadRow so we only have to find it once */
	this.scrollBodyTableHeadRow=null;

	/* Add draw callback */
	oDTSettings.oApi._fnCallbackReg(oDTSettings, 'aoDrawCallback', jQuery.proxy(this._fnDraw, this), 'ColResize');

	this.isOldIE=$.browser && $.browser.msie && ($.browser.version == "6.0" || $.browser.version == "7.0" || $.browser.version == "8.0")
	
	/* Force some styles where appropriate */
	
	// In IE8 and below in quirks mode, layout doesn't expand the table, so force it to table style
	if (this.isOldIE && document.documentMode && document.documentMode==5
			&& this.s.resizeStyle=="layout") {
		this.s.resizeStyle="table";
		alert("Your Internet Explorer browser is operating in Quirks mode.  This mode is not supported by the dataTables plugin.");
		console.log("ColResize is using table resize style instead of layout in IE8 and below.");
	}
	
	// Set table layout fixed for layout and greedy resizeStyle.  The data table doesn't change with greedy style
	// if layout is not fixed.  Also allows cells to contract to cover long text.
	if (this.s.resizeStyle=="layout" || this.s.resizeStyle=="greedy") {
		$(this.s.dt.nTable).css('table-layout','fixed');
		$('.dataTables_scrollHead table').css('table-layout','fixed');
	}

	return this;
};



ColResize.prototype = {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Reset the column sizing to the original sizes that were detected on
	 * start up.
	 *  @return {this} Returns `this` for chaining.
	 *
	 *  @example
	 *    // DataTables initialisation with ColResize
	 *    var table = $('#example').dataTable( {
	 *        "sDom": 'Rlfrtip'
	 *    } );
	 *
	 *    // Add click event to a button to reset the ordering
	 *    $('#resetOrdering').click( function (e) {
	 *        e.preventDefault();
	 *        $.fn.dataTable.ColResize( table ).fnReset();
	 *    } );
	 */
	"fnReset": function ()
	{
		// not implemented for resizing yet
		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods (they are of course public in JS, but recommended as private)
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Constructor logic
	 *  @method  _fnConstruct
	 *  @returns void
	 *  @private
	 */
	"_fnConstruct": function ()
	{
		var that = this;
		var iLen = this.s.dt.aoColumns.length;
		var i;


		/* allow resize */
		if ( typeof this.s.init.allowResize != 'undefined' )
		{
			this.s.allowResize = this.s.init.allowResize;
		}

        if (typeof this.s.init.minResizeWidth != 'undefined') {
            this.s.minResizeWidth = this.s.init.minResizeWidth;
        }

        if (typeof this.s.init.resizeStyle != 'undefined') {
            this.s.resizeStyle = this.s.init.resizeStyle;
        }

        if (typeof this.s.init.fnResizeTableCallback == 'function') {
            this.s.fnResizeTableCallback = this.s.init.fnResizeTableCallback;
        }

		/* Add event handlers for the resize */
        this._fnAddMouseListeners();

        if ( this.s.dt.oLoadedState && typeof this.s.dt.oLoadedState.ColResize != 'undefined' &&
      		 this.s.dt.oLoadedState.ColResize.columnWidths.length == this.s.dt.aoColumns.length ) {
      		this._fnSizeTables(this.s.dt.oLoadedState.ColResize.tableSize);
			this._fnSizeColumns(this.s.dt.oLoadedState.ColResize.columnWidths);
		}

		/* State saving */
		this.s.dt.oApi._fnCallbackReg( this.s.dt, 'aoStateSaveParams', function (oS, oData) {
			that._fnStateSave.call( that, oData );
		}, "ColResize_State" );

		/* Listen for column reordering events */
		$(this.s.dt.oInstance).on( 'column-reorder', null, function (oS, oData) {
			/* Re-apply mouse listeners using new column order */
	        that._fnAddMouseListeners();
		});
	},
	
	/**
	 * Add mouse listeners to each column
	 *  @method  _fnAddMouseListeners
	 *  @returns void
	 *  @private
	 */
	"_fnAddMouseListeners": function () {
		var iLen = this.s.dt.aoColumns.length;
		
		/* Add event handlers for the drag and drop, and also mark the original column order */
		for ( var i = 0; i < iLen; i++ )
		{
			this._fnMouseListener( i, this.s.dt.aoColumns[i].nTh );
		}
	},


	/**
	 * Set the size of the tables to fit in the resized columns
	 *  @method  _fnSizeColumns
	 *  @param   int iWidth An integer which dictates the width of the table
	 *  @returns void
	 *  @private
	 */
	"_fnSizeTables": function ( iWidth )
	{
		if (iWidth==null) {
			this.s.dt.oInstance.oApi._fnLog( this.s.dt, 1, "ColResize - table resize is null. Skipping." );
			return;
		}
		
		// resize the data table
		$(this.s.dt.nTable).width(iWidth);
		
		// resize the header table if scroll is enabled
		$(".dataTables_scrollHead table").width(iWidth);
	},
	
	/**
	 * Set the column order from an array
	 *  @method  _fnOrderColumns
	 *  @param   array a An array of integers which dictate the column order that should be applied
	 *  @returns void
	 *  @private
	 */
	"_fnSizeColumns": function ( a )
	{
		if ( a.length != this.s.dt.aoColumns.length )
		{
			this.s.dt.oInstance.oApi._fnLog( this.s.dt, 1, "ColResize - array columnWidths does not "+
				"match known number of columns. Skipping." );
			return;
		}
		
		for ( var i=0, iLen=a.length ; i<iLen ; i++ )
		{
			var aoColumn = this.s.dt.aoColumns[i];
			var currSize = aoColumn.sWidth;
			if ( a[i] != currSize )
			{
				/* Do the column resize in the table */
				this.s.dt.oInstance.fnColResize( i, a[i] );
			}
		}

		/* Save the state */
		this.s.dt.oInstance.oApi._fnSaveState( this.s.dt );
	},


	/**
	 * Store the new column sizes.  Important to note that the sizes in the array will be in the current order of the table. 
	 * Which means if ColReorder has changed the order, the array will be in the changed order, not the original order from
	 * datatables config.
	 * 
	 *  @method  _fnStateSave
	 *  @param   object oState DataTables state
	 *  @returns string JSON encoded cookie string for DataTables
	 *  @private
	 */
	"_fnStateSave": function ( oState )
	{
		var i, iLen, aCopy, iOrigColumn;
		var oSettings = this.s.dt;

		// could save table size as well, would make it easier to restore when resize style is table
		oState.ColResize = {};
		oState.ColResize.tableSize=$(oSettings.nTable).width();
		oState.ColResize.columnWidths = [];
		
		for ( i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
		{
			/* Store the width of the th, not the swidth stored in aoColumns.  The actual width may have been adjusted by the
			 * browser unknown to the settings (should the resizer account for this and update sWidth of all columns after 
			 * resizing one column?) 
			 * 
			 * If ColReorder has stored origin columns, use the original column position for the array.  This will load correctly if
			 * ColReorder has not done its thing already.  This may not be dependable though in the case that ColReorder goes first.
			 * */
			var aoColumn = oSettings.aoColumns[i];
			var correctedI = ("_ColReorder_iOrigCol" in aoColumn)?aoColumn._ColReorder_iOrigCol:i;
			oState.ColResize.columnWidths[correctedI]=$(aoColumn.nTh).width();
		}
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Mouse drop and drag
	 */

	/**
	 * Add a mouse down listener to a particluar TH element
	 *  @method  _fnMouseListener
	 *  @param   int i Column index
	 *  @param   element nTh TH element clicked on
	 *  @returns void
	 *  @private
	 */
	"_fnMouseListener": function ( i, nTh )
	{
		var that = this;
		
		// rebind events since after column re-order they use wrong column indices
		$(nTh).unbind('mousemove.ColResize');
		$(nTh).unbind('mousedown.ColResize');

	    // listen to mousemove event for resize
	    if (this.s.allowResize) {
	  		$(nTh).bind( 'mousemove.ColResize', function (e) {   
		      	if ( that.dom.resize === null)
		      	{                                               
		      		/* Store information about the mouse position */
		      		var nThTarget = e.target.nodeName == "TH" ? e.target : $(e.target).parents('TH')[0];
		      		var offset = $(nThTarget).offset();             
		      		var nLength = $(nThTarget).innerWidth();  
		      		                                               
		      		/* are we on the col border (if so, resize col) */     
		      		if (Math.abs(e.pageX - Math.round(offset.left + nLength)) <= 5) {                                                       
		      			$(nThTarget).css({'cursor': 'col-resize'});            
		      		}        
		            else                              
		                $(nThTarget).css({'cursor': 'pointer'});     
		        }
	  		});

			$(nTh).on( 'mousedown.ColResize', function (e) {
				e.preventDefault();
				that._fnMouseDown.call( that, e, nTh, i ); //Martin Marchetta: added the index of the column dragged or resized
				return false;
			} );
		}
	},


	/**
	 * Mouse down on a TH element in the table header
	 *  @method  _fnMouseDown
	 *  @param   event e Mouse event
	 *  @param   element nTh TH element to be dragged
	 *  @returns void
	 *  @private
	 */
	"_fnMouseDown": function ( e, nTh, i )
	{
		var
			that = this,
			aoColumns = this.s.dt.aoColumns;
	
			/* are we resizing a column ? */
			if ($(nTh).css('cursor') == 'col-resize') {         
			  this.s.mouse.startX = e.pageX;
			  this.s.mouse.startWidth = $(nTh).width();
			  this.s.mouse.resizeElem = $(nTh); 
			  var nThNext = $(nTh).next();
			  this.s.mouse.nextStartWidth = $(nThNext).width();
			  that.dom.resize = true;
			  //a. Disable column sorting so as to avoid issues when finishing column resizing
			  this.s.dt.aoColumns[i].bSortable = false;
			  //b. Disable Autowidth feature (now the user is in charge of setting column width so keeping this enabled looses changes after operations)
			  this.s.dt.oFeatures.bAutoWidth = false;
			}
			else {
			  that.dom.resize = null;
			}

		/* Add event handlers to the document */
		$(document)
			.on( 'mousemove.ColResize', function (e) {
				that._fnMouseMove.call( that, e, i );
			} )
			.on( 'mouseup.ColResize', function (e) {
				//Martin Marcheta: Added this small delay in order to prevent collision with column sort feature (there must be a better
				//way of doing this, but I don't have more time to digg into it)
				setTimeout(function(){
					that._fnMouseUp.call( that, e, i );
				}, 10);
			} );
	},


	/**
	 * Deal with a mouse move event while dragging a node
	 *  @method  _fnMouseMove
	 *  @param   event e Mouse event
	 *  @returns void
	 *  @private
	 */
	"_fnMouseMove": function ( e, colResized )
	{
		var that = this;

		/* are we resizing a column ? */
		if (this.dom.resize) {
			var nTh = this.s.mouse.resizeElem;
			var nThNext = $(nTh).next();
			var moveLength = e.pageX-this.s.mouse.startX; 

			var scrollXEnabled = this.s.dt.sScrollX === undefined ? false: true;
		  
			var newWidth = this.s.mouse.startWidth + moveLength;
			var minResizeWidth=this.s.minResizeWidth;
			if (minResizeWidth=="initial") {
				minResizeWidth=this.s.dt.aoColumns[colResized].sWidthOrig;
				if (minResizeWidth!=null) {
					// try to cache the parsed value so we don't have to do this every event
					minResizeWidth=this.s.dt.aoColumns[colResized].sWidthOrigInt;
					if (minResizeWidth==null) {
						// grab the string version
						minResizeWidth=this.s.dt.aoColumns[colResized].sWidthOrig;	  
						// remove px and parse to an int
						minResizeWidth=parseInt(minResizeWidth.substring(0, minResizeWidth.length -2));
						// save for next time
						this.s.dt.aoColumns[colResized].sWidthOrigInt=minResizeWidth;
					}
				}
			}
		  
			// enforce a minimum width, should allow "initial" which uses sWidth set in init
	        if (newWidth < minResizeWidth) {
	        	newWidth = minResizeWidth;
	            moveLength = newWidth - this.s.mouse.startWidth ;
	        }
	        
			if (moveLength != 0) {
				// if resize style is greedy resize the column next to the column that is being resized
				if (this.s.resizeStyle=="greedy") {
					$(nThNext).width(this.s.mouse.nextStartWidth - moveLength);
				}
				
				// resize the actual column
				$(nTh).width(this.s.mouse.startWidth + moveLength);
			
				// handle the tables involved if we are scrolling x or y
				if(this.s.dt.nScrollBody){
					//Since some columns might have been hidden, find the correct one to resize in the table's body			
					var visibleColumnIndex;
					var currentColumnIndex;
					visibleColumnIndex = -1;
					for(currentColumnIndex=-1; currentColumnIndex < this.s.dt.aoColumns.length-1 && currentColumnIndex != colResized; currentColumnIndex++){
						if(this.s.dt.aoColumns[currentColumnIndex+1].bVisible)
							visibleColumnIndex++;
					}
		
					// find the table head row of the scroll body.  prefer the one set by a modified datatables.
					var scrollBodyTableHeadRow=this.s.dt.nHiddenHeaderRow[0];
					// if datatables did not supply it, then find it ourselves from the scrollBody.  not caching it
					// since sorting a table will create a new hidden header
					if (scrollBodyTableHeadRow==null) {
						// use the nScrollBody set by dataTables to find 
						var scrollingTableHead = this.s.dt.nScrollBody.getElementsByTagName('thead')[0];
						scrollBodyTableHeadRow = scrollingTableHead.getElementsByTagName('tr')[0];
					}
					
					// Resize the hidden header row in the body, this will cause the data rows to be resized
					//  if resize style is greedy, change the size of the next column
					if (moveLength != 0 && this.s.resizeStyle=="greedy"){
						$(scrollBodyTableHeadRow.childNodes[visibleColumnIndex+1]).width(this.s.mouse.nextStartWidth - moveLength);
					}
					// resize the actual th in the hidden header row
					$(scrollBodyTableHeadRow.childNodes[visibleColumnIndex]).width(this.s.mouse.startWidth + moveLength);
					
					// if resize style is table, change the size of the body table to account for the new size of the column
					if (this.s.resizeStyle=="table") {
						// find the table head row of the header.  prefer any cached header 
		            	if (this.scrollHeadTableHeadRow==null) {
		            		// if not found, prefer the one set by a modified datatables.
		            		this.scrollHeadTableHeadRow=this.s.dt.nVisibleHeaderRow[0];
							// if datatables did not supply it, then find it ourselves from the scrollHead.  
							if (this.scrollHeadTableHeadRow==null) {
								// use the nScrollHead set by dataTables to find 
								var visibleTableHead = this.s.dt.nScrollHead.getElementsByTagName('thead')[0];
								this.scrollHeadTableHeadRow = visibleTableHead.getElementsByTagName('tr')[0];
							}
		            	}
		            	
		            	// resize the table in the scroll header
						if (this.scrollHeadTableHeadRow!=null) {
							var $headerTable = $(this.scrollHeadTableHeadRow.parentNode.parentNode);
			            	//Keep the current table's width so that we can increase the original table width by the mouse move length
			                if (this.table_size < 0) {
			                    this.table_size = $headerTable.width();
			                }
			                $headerTable.width(this.table_size + moveLength);
							
							// and resize the table in the scroll body
							$(this.s.dt.nTable).width(this.table_size + moveLength);
		            	}
		            }
				}
				// resize style is table and no scroll x, so just resize the table
				else if (this.s.resizeStyle=="table") {
					//Keep the current table's width so that we can increase the original table width by the mouse move length
	                if (this.table_size < 0) {
	                    this.table_size = $(this.s.dt.nTable).width();
	                }
				   var newTableWidth = this.table_size + moveLength;
                   $(this.s.dt.nTable).width(newTableWidth);
				}
				
				// trigger callback handler
				this.s.fnResizeTableCallback($(this.s.dt.nTable),$(nTh),moveLength);
			}
				  
			return;
		}
	},


	/**
	 * Finish off the mouse drag and insert the column where needed
	 *  @method  _fnMouseUp
	 *  @param   event e Mouse event
	 *  @returns void
	 *  @private
	 */
	"_fnMouseUp": function ( e, colResized )
	{
		var that = this;

		$(document).off( 'mousemove.ColResize mouseup.ColResize' );

		if(this.dom.resize !== null) {
			var i;
			var j;
			var currentColumn;
			var nextVisibleColumnIndex;
			var previousVisibleColumnIndex;
			var scrollXEnabled;
			
			//Re-enable column sorting
			this.s.dt.aoColumns[colResized].bSortable = true;
			
			//Save the new resized column's width
			this.s.dt.aoColumns[colResized].sWidth = $(this.s.mouse.resizeElem).innerWidth() + "px";
			
			//If other columns might have changed their size, save their size too
			scrollXEnabled = this.s.dt.oInit.sScrollX === "" ? false:true;			
			if(!scrollXEnabled){
				//The colResized index (internal model) here might not match the visible index since some columns might have been hidden
				for(nextVisibleColumnIndex=colResized+1; nextVisibleColumnIndex < this.s.dt.aoColumns.length; nextVisibleColumnIndex++){
					if(this.s.dt.aoColumns[nextVisibleColumnIndex].bVisible)
						break;
				}

				for(previousVisibleColumnIndex=colResized-1; previousVisibleColumnIndex >= 0; previousVisibleColumnIndex--){
					if(this.s.dt.aoColumns[previousVisibleColumnIndex].bVisible)
						break;
				}
				
				if(this.s.dt.aoColumns.length > nextVisibleColumnIndex)
					this.s.dt.aoColumns[nextVisibleColumnIndex].sWidth = $(this.s.mouse.resizeElem).next().innerWidth() + "px";
				else{ //The column resized is the right-most, so save the sizes of all the columns at the left
					currentColumn = this.s.mouse.resizeElem;
					for(i = previousVisibleColumnIndex; i > 0; i--){
						if(this.s.dt.aoColumns[i].bVisible){
							currentColumn = $(currentColumn).prev();
							this.s.dt.aoColumns[i].sWidth = $(currentColumn).innerWidth() + "px";
						}
					}
				}
			}			
			
			//Update the internal storage of the table's width (in case we changed it because the user resized some column and scrollX was enabled
			/*if(scrollXEnabled && $('div.dataTables_scrollHead', this.s.dt.nTableWrapper) != undefined){
				if($('div.dataTables_scrollHead', this.s.dt.nTableWrapper).length > 0)
					this.table_size = $($('div.dataTables_scrollHead', this.s.dt.nTableWrapper)[0].childNodes[0].childNodes[0]).width();
			}*/
			
			//Save the state
			this.s.dt.oInstance.oApi._fnSaveState( this.s.dt );
		}
		///////////////////////////////////////////////////////
		
		this.dom.resize = null;
	},

	/**
	 * Clean up ColResize memory references and event handlers
	 *  @method  _fnDestroy
	 *  @returns void
	 *  @private
	 */
	"_fnDestroy": function ()
	{
		var i, iLen;

		for ( i=0, iLen=this.s.dt.aoDrawCallback.length ; i<iLen ; i++ )
		{
			if ( this.s.dt.aoDrawCallback[i].sName === 'ColResize_Pre' )
			{
				this.s.dt.aoDrawCallback.splice( i, 1 );
				break;
			}
		}

		$(this.s.dt.nTHead).find( '*' ).off( '.ColResize' );

		$.each( this.s.dt.aoColumns, function (i, column) {
			$(column.nTh).removeAttr('data-column-index');
		} );

		this.s.dt._ColResize = null;
		this.s = null;
	},
	
	/**
	 * Set the table width to auto so that expanding a column will not scrunch other cols
	 * It is necessary to set the width first to force it wide enough to scroll, then set to auto so that the cols
	 * aren't scrunchable.
	 * 
	 *  @method  _fnDraw
	 *  @returns void
	 *  @private
	 */
	"_fnDraw": function ()
	{
		if (!(this.isOldIE || this.s.resizeStyle=="table")) {
			$(".dataTables_scrollHead table").width("auto");
			$(".dataTables_scrollBody table").width("auto");
		}
	}
};





/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Static parameters
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/**
 * ColResize default settings for initialisation
 *  @namespace
 *  @static
 */
ColResize.defaults = {
	/**
	 * Predefined sizing for the columns that will be applied automatically
	 * on initialisation. If not specified then the size that the columns are
	 * found to be in the HTML is the size used.
	 *  @type array
	 *  @default null
	 *  @static
	 *  @example
	 *      // Using the `oColResize` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColResize": {
	 *              "aiOrder": [ 4, 3, 2, 1, 0 ]
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColResize( '#example', {
	 *          "aiOrder": [ 4, 3, 2, 1, 0 ]
	 *      } );
	 */
	aiSize: null,
	
	/**
	 * Allow Resize functionnality
	 *  @property allowResize
	 *  @type     boolean
	 *  @default  true
	 */
	allowResize: true,
	
	/**
     * Minimum width for columns (in pixels)
     * Default is 10. If set to 0, columns can be resized to nothingness.
     * @property minResizeWidth
     * @type     integer
     * @default  10
     */
     minResizeWidth: 10,

     /**
     * Method to use for dealing with change in column size.  Choices are :
     *  greedy - as column gets bigger, take space from the neighbor, eventually push the table wider
     *  layout - set table-layout to fixed and width to auto, let browser expand the grid.
     *  		 layout should be faster than setting the width of the table ourselves
     *  table - add width to the parent table as column gets larger. should work like layout but
     *  		 a little slower 
     * 
     * @property resizeStyle
     * @type     string
     * @default  greedy
     */
     resizeStyle: "greedy",


     /**
     * Callback called after each time the table is resized
     * This could be multiple times on one mouse move.
     * useful for resizing a containing element.
     * Passed the table element, th element, and the size change
     * @property fnResizeTableCallback
     * @type     function
     * @default  function(table, newSize, sizeChange) {}
     */
     fnResizeTableCallback: null
	
};



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * ColResize version
 *  @constant  version
 *  @type      String
 *  @default   As code
 */
ColResize.version = "0.1.0";



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interfaces
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Expose
$.fn.dataTable.ColResize = ColResize;
$.fn.DataTable.ColResize = ColResize;


// Register a new feature with DataTables
if ( typeof $.fn.dataTable == "function" &&
     typeof $.fn.dataTableExt.fnVersionCheck == "function" &&
     $.fn.dataTableExt.fnVersionCheck('1.9.3') )
{
	$.fn.dataTableExt.aoFeatures.push( {
		"fnInit": function( settings ) {
			var table = settings.oInstance;

			if ( ! settings._ColResize ) {
				var dtInit = settings.oInit;
				var opts = dtInit.ColResize || dtInit.oColResize || {};

				new ColResize( settings, opts );
			}
			else {
				table.oApi._fnLog( settings, 1, "ColResize attempted to initialise twice. Ignoring second" );
			}

			return null; /* No node for DataTables to insert */
		},
		"cFeature": "Z",
		"sFeature": "ColResize"
	} );
}
else {
	alert( "Warning: ColResize requires DataTables 1.9.3 or greater - www.datatables.net/download");
}


// API augmentation
if ( $.fn.dataTable.Api ) {
	$.fn.dataTable.Api.register( 'ColResize.reset()', function () {
		return this.iterator( 'table', function ( ctx ) {
			ctx._ColResize.fnReset();
		} );
	} );

	$.fn.dataTable.Api.register( 'ColResize.size()', function ( set ) {
		/*if ( set ) {
			return this.iterator( 'table', function ( ctx ) {
				ctx._ColResize.fnOrder( set );
			} );
		}

		return this.context.length ?
			this.context[0]._ColResize.fnOrder() :
			null;*/
	} );
}

return ColResize;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( 'datatables-ColResize', ['jquery', 'datatables'], factory );
}
else if ( jQuery && !jQuery.fn.dataTable.ColResize ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);
