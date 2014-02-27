ColReorderWithResize
====================

A version of ColReorderWithResize to fix bugs and implement new features

New options include:

minResizeWidth: (default: 10). Minimum size that columns can be.  A value of 'initial' makes minimum size the original sWidth of the column.  The original minResizeWidth code borrowed from j<a href="https://github.com/jhubble/ColReorderWithResize">JHubble ColReorderWithResize</a> plugin.

resizeStyle : (default: greedy).  How to resize the column.  Options include

1. greedy - As column changes, add or subtract width from or to the next column. Forces table-layout to fixed.
1. table - As column changes, add or subtract width from or to the header and body tables.  This is slow in some older browsers.
1. layout - As column changes, let browser resize the width of the tables.  Forces table-layout to fixed and width of tables to "auto".  The change to auto causes the browser not to "scrunch" other columns when resizing (or adding/removing columns).

fnResizeTableCallback: Call function every time the table is resized.  Borrowed from JHubble version referenced above.


Other options remain the same as those in the <a href="http://datatables.net/extras/colreorder/">ColReorder</a> plugin.

Basic initialization:
`````javascript
$(document).ready( function () {
    $('#example').dataTable( {
        "sDom": 'Rlfrtip'
    } );
} );
`````
