ColResize
====================

A datatables plugin which allows column resizing.  Based on the original datatables 3rd party extra called ColReorderWithResize.  This version is not tangled up with the Reorder plugin.

This plugin requires use of my version of the ColReorder plugin or else drag and resize will collide with each other.

Options remain the same as those in the <a href="http://datatables.net/extras/colreorder/">ColReorder</a> plugin.

Basic initialization:
`````javascript
$(document).ready( function () {
    $('#example').dataTable( {
        "sDom": 'Zlfrtip'
    } );
} );
`````