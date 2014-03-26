/*
 * Adds a function to datatables which can find a column index by the defined name of the column
 */
$.fn.dataTableExt.oApi.getColumnIndexByName = function ( oSettings, colname ) {
 
    var colIndeces = [];
    for( var i = 0; i < oSettings.aoColumns.length; i++)
    {
   	    var aoColumn=oSettings.aoColumns[i];
        if(aoColumn.sName == $.trim(colname))
        {
            return i;
        }
    }
 
    return -1;
};