/*@auther alfred.qiu*/

$(function(){

function ChironTable(trigger,options){
	this.version="0.0.1";
	this.$trigger=$(trigger);
	this.options=options;
	this.originOptions=$.extend(true,{},options);

	this.init();
};

ChironTable.DEFAULTS={
	width:1800,
	tableClass:"table table-bordered",
	columns:[],
	data:[],
	cellClass:{},
	cellBinder:{},
	cellStyle:{},
	cellAttr:{},
	cellData:{},
	group:false,
	dragable:false,
	pagination:true,
	slide:"client",
	queryParam:{},
	formatThead:function(text){
		return text;
	},
	formatTbody:function(text){
		return text;
	}
};

ChironTable.prototype.init=function(){
	var that=this;

	this.initData();
	this.renderTable();
	this.renderHeader();
	this.renderTools();
	this.renderBody();
}

ChironTable.prototype.initData=function(){
	var that=this;

	this.keys=[];
	if ( !$.isEmptyObject(that.options.columns) ){
		$.each(that.options.columns,function(index,item){
			that.keys.push(item.field);
		});
	};
};

ChironTable.prototype.renderTable=function(){
	var that=this;

	this.$table=$("<table></table>").appendTo(that.$trigger);
	this.$thead=$("<thead></thead>").appendTo(that.$table);
	this.$tbody=$("<tbody></tbody>").appendTo(that.$table);

	this.$table.addClass(that.options.tableClass);
};

ChironTable.prototype.renderHeader=function(){
	var that=this,
		html=[];

	html.push("<tr>");
	$.each(that.options.columns,function(index,item){
		html=html.concat(
			["<th data-field='"+item.field+"' "],
			[item.width?style="style='width:"+item.width+"px'":""],
			[">"],
			["<div class='inner-th'>"+that.options.formatThead(item.title)+"</div>"],
			["<div class='fht-cell'></div>"],
			["</th>"]
		);
	});
	html.push("</tr>");

	html=html.join("");
	$html=$(html).appendTo(that.$thead);
};

ChironTable.prototype.renderTools=function(){
	var that=this;

	if ( that.options.pagination ){
		if ( that.options.slide=="client" ){
			$("<div style='margin-top:-20px'></div>").appendTo(that.$trigger)
				.chironPagination({
					data:that.options.data,
					perPageItems:2,
					handlerData:function(data){
						that.options.data=data;
						that.renderBody();
					}
				});
		}else{
			$("<div style='margin-top:-20px'></div>").appendTo(that.$trigger)
				.chironPagination({
					data:that.options.data,
					slide:"server",
					ajax:true,
					queryParam:that.options.queryParam,
					handlerData:function(data){
						that.options.data=data;
						that.renderBody();
					}
				});
		}
		
	};
};

ChironTable.prototype.handlerData=function(){
	var that=this,
		data=this.options.data;

	if ( !$.isEmptyObject(data) ){
		this.$tds=[];

		this.$tds.length=this.totalRows=data.length;
		this.totalCols=this.options.columns.length;
		$.each(this.$tds,function(index,item){
			that.$tds[index]=[];
			that.$tds[index].length=that.totalCols;
		});

		if ( this.options.group ){
			this.rowspanMark=[];
			this.rowspanMark.length=this.totalRows;
			$.each(this.rowspanMark,function(index,item){
				that.rowspanMark[index]=[];
				that.rowspanMark[index].length=that.totalCols;
				$.each(that.rowspanMark[index],function(_index,_item){
					that.rowspanMark[index][_index]={marker:false,index:_index};
				});
			});
		};
	};

	if ( this.options.sort ){
		key=this.options.columns[0].field;
		sort(that.options.data,key);
	};

	if ( this.options.group ){

		if ( this.options.dragable ){
			throw new Error("Group and drag can't be exist together.");
		};

		function markGroup(array,key,colIndex){
			var values=[];
			$.each(array,function(index,item){
				if ( values.indexOf(item[key])!=-1 ){
					that.rowspanMark[index][colIndex].marker=true;
				}else{
					values.push(item[key]);
				};
			});
		};

		$.each(this.keys,function(index,key){
			if ( index==0 ){
				markGroup(that.options.data,key,index);
			}else{
				var beginIndex,
					filterDatas=[];

				$.each(that.rowspanMark[index],function(_index,_item){
					if ( _item.marker==true && beginIndex==undefined ){
						beginIndex=_item;
						filterDatas.push([]);
						filterDatas[filterDatas.length-1].push(that.options.data[_index]);
					};

					if ( _index==beginIndex+1 ){
						beginIndex++;
						filterDatas[filterDatas.length-1].push(that.options.data[_index]);
					};

					if ( _index!=beginIndex+1 ){
						beginIndex=_index;
						filterDatas.push([]);
						filterDatas[filterDatas.length-1].push(that.options.data[_index]);
					};
				});

				$.each(filterDatas,function(_index,filterData){
					markGroup(filterData,key,index);
				});
			};
		});

		$.each(that.rowspanMark,function(index,item){
			$.each(item,function(_index,_item){
				that.rowspanMark[index][_index]=_item.marker;
			});
		});

		that.rowspanMark=reverseMatrix(that.rowspanMark);
	};
};

ChironTable.prototype.renderBody=function(){
	var that=this,
		key,
		data=this.options.data;

	this.clean();

	if ( $.isEmptyObject(data) ){
        $("<tr id='chironTableNoData'><td colspan='"+that.options.columns.length+
        		"'>没有数据！</td></tr>").appendTo(that.$tbody);
        return;
    }else{
        if ( $("#chironTableNoData").length ) $("#noLinkageToggleData").remove();
    };

	this.handlerData();

	$.each(data,function(index,item){
		var $tr=$("<tr></tr>").appendTo(that.$tbody),
			$tds=[];

		$.each(that.options.columns,function(_index,_item){
			var html=[],
				formatter=_item.formatter,
				handler=_item.handler,
				value=item[_item.field];

			if ( value!=undefined && value!="" && _item.field==key ){
				html=html.concat(
					["<td data-field='"+_item.field+"' "],
						[item.colspan?"colspan='"+item.colspan+"'":""],
						[item.rowspan?" rowspan='"+item.rowspan+"'":""],
					[">"],
					["<div class='inner-td'>"],
						[formatter?formatter(item,index,handler):that.options.formatTbody(value)],
					["</div>"],
					["<div class='fht-cell'></div>"],
					["</td>"]
				);
			};

			if ( value!=undefined && value!="" && _item.field!=key ){
				html=html.concat(
					["<td data-field='"+_item.field+"' "],
					[">"],
					["<div class='inner-td'>"],
						[formatter?formatter(item,index,handler):that.options.formatTbody(value)],
					["</div>"],
					["<div class='fht-cell'></div>"],
					["</td>"]
				);
			};

			if ( value==undefined ){
				html=html.concat(
					["<td data-field='"+_item.field+"' "],
					[">"],
					["<div class='inner-td'>"],
						[formatter?formatter(item,index,handler):"-"],
					["</div>"],
					["<div class='fht-cell'></div>"],
					["</td>"]
				);
			};

			html=html.join("");
			$td=$(html);

			var coordinate=_index+"-"+index;

			if ( _item.td ){
				$td.addClass(_item.td.class?_item.td.class:"");
				$td.css(!$.isEmptyObject(_item.td.style)?_item.td.style:{});
			};

			$td.addClass(that.options.cellClass[coordinate]?that.options.cellClass[coordinate]:"");

			if ( _item.td ){
				$.each(_item.td.data,function(key,value){
					$td.data(key,value);
				});
			};
			
			if ( that.options.cellData[coordinate] ){
				$.each(that.options.cellData[coordinate],function(key,value){
					$td.data(key,value);
				});
			};
			
			if ( _item.td ){
				$.each(_item.td.attr,function(key,value){
					$td.data(key,value);
				});
			};
			
			if ( that.options.cellAttr[coordinate] ){
				$.each(that.options.cellAttr[coordinate],function(key,value){
					$td.attr(key,value);
				});
			};

			$td.attr("td-coordinate",coordinate);
			$td.attr("row-index",index);
			$td.attr("col-index",_index);

			$.each(that.options.cellBinder,function(key,binders){
				if ( key==coordinate ){
					$.each(binders,function(i,binder){
						if ( !binder.captureNode ){
							$td.on(binder.eventName,
								function(){binder.eventHandler.call(binder.content?binder.content:$td)});
						}else{
							$td.on(binder.eventName,binder.captureNode,
								function(){binder.eventHandler.call(binder.content?binder.content:$td)});
						};
					});
				};
			});

			that.$trigger.trigger("td"+coordinate+":chironTable");

			that.$tds[index][_index]=$td;

			$td.appendTo($tr);

			if ( that.options.dragable ){
				new ChironDrag($tr);

				$tr.off("dragStop:chrionDrag").on("dragStop:chrionDrag",function(e,y){
					var trIndex=$(this).index(".chiron-dragable"),
						length=that.$tbody.find("tr").length,
						data=that.options.data[trIndex],
						h=0,i;

					if ( y>0 ){
						for ( i=trIndex+1;i<length;i++  ){
							h+=$(".chiron-dragable").eq(i).innerHeight();
							if ( h>y ){
								$tr.insertBefore($(".chiron-dragable").eq(i));

								that.options.data.splice(i,0,data);
								that.options.data.splice(trIndex,1);
								break;
							};
							if ( i==length-1 && h<y ){
								$tr.insertAfter($(".chiron-dragable").eq(i));

								that.options.data.splice(trIndex,1);
								that.options.data.push(data);
							};
						};
					}else{
						for ( i=trIndex-1;i>0;i-- ){
							h+=$(".chiron-dragable").eq(i).innerHeight();
							if ( h>-y ){
								$tr.insertAfter($(".chiron-dragable").eq(i));

								that.options.data.splice(trIndex,1);
								that.options.data.splice(i+1,0,data);
								break;
							};
							if ( i==1 && h<-y ){
								$tr.insertBefore($(".chiron-dragable").eq(0));

								that.options.data.splice(trIndex,1);
								that.options.data.unshift(data);
							};
						};
					};
				});
			};

		});

		$tr.addClass(item.class?item.class:"");
		$tr.css(!$.isEmptyObject(item.css)?item.style:{});

		$.each(item.data,function(key,value){
			$tr.data(key,value);
		});

		$.each(item.attr,function(key,value){
			$tr.data(key,value);
		});

		$.each(item.binder,function(i,binder){
			if ( !binder.captureNode ){
				$tr.on(binder.eventName,
					function(){binder.eventHandler.call(binder.content?binder.content:$tr)});
			}else{
				$tr.on(binder.eventName,binder.captureNode,
					function(){binder.eventHandler.call(binder.content?binder.content:$tr)});
			};
		});

		that.$trigger.trigger("tr"+index+":chironTable");
	});

	if ( this.options.group ){
		var tds=reverseMatrix(that.$tds);

		$.each(tds,function(index,item){
			var beginIndex,td=[],rowspan=1;
			$.each(item,function(_index,_item){
				if ( that.rowspanMark[index][_index] && beginIndex==undefined ){
					beginIndex=_index;
					td.push(_index-1);
					td.push(index);
					rowspan++;
					that.$tds[td[0]][td[1]].attr("rowspan",rowspan);
					that.$tds[_index][index].detach();
					return;
				};
				if ( that.rowspanMark[index][_index] && _index==beginIndex+1 ){
					beginIndex++;
					rowspan++;
					that.$tds[td[0]][td[1]].attr("rowspan",rowspan)
					that.$tds[_index][index].detach();
					return;
				};
				if ( that.rowspanMark[index][_index] && _index!=beginIndex+1 ){
					beginIndex=_index;
					td=[];
					td.push(_index-1);
					td.push(index);
					rowspan=2;
					that.$tds[td[0]][td[1]].attr("rowspan",rowspan)
					that.$tds[_index][index].detach();
					return;
				};
			});
		});
	};

	that.$trigger.trigger("tbody:chironTable",that.$tbody);

	this.place();
};

ChironTable.prototype.place=function(){
	var that=this;

	var width=this.$trigger.innerWidth(),
		height=this.$trigger.innerHeight();

	if ( this.options.height  && this.options.height<height ){
		$scroll=$("<div style='width:20px;height:100px;overflow:scroll'></div>").appendTo(document.body);
		$scrollChild=$("<div style='width:100%;height:120px'>").appendTo($scroll);

		var scrollWidth=$scroll.innerWidth()-$scrollChild.innerWidth();

		$scroll.remove();

		this.$trigger.css({"overflow":"auto"})
			.width(width).height(that.options.height);
		this.$table.width(1800);
		this.$trigger.width(width-scrollWidth);
	};
};

ChironTable.prototype.clean=function(){
	this.$tbody.html("");
};

ChironTable.prototype.refresh=function(data){
	this.options.data=data;

	this.renderBody();
};

ChironTable.prototype.addItem=function(option){
	this.options.data.push(option);

	this.renderBody();
};

ChironTable.prototype.delItem=function(index){
	this.options.data.splice(index,1);

	this.renderBody();
};

ChironTable.prototype.getData=function(){
	return that.options.data;
};

var allowedMethods=["refresh","addItem","delItem","getData"];

/*   util   */
function sort(array,key){
	array.sort(function(a,b){
		var aa=a[key],
			bb=b[key],
			order=1;

		if ($.isNumeric(aa) && $.isNumeric(bb)) {
	        aa = parseFloat(aa);
	        bb = parseFloat(bb);
	        if (aa < bb) {
	            return -1*order;
	        };
	        return 1*order;
	    };

	    if (aa === bb) {
	        return 0;
	    };

	    if (typeof aa!=='string') {
	        aa=aa.toString();
	    };

	    if (aa.localeCompare(bb)===-1) {
	        return -1*order;
	    };

		return 1*order;
	});
};

function group(array,key){
	var keys=[],
		result={};

	$.each(array,function(index,item){
		if ( keys.indexOf(item[key])==-1 ){
			keys.push(item[key]);
			var obj=$.extend(true,{},item);
			obj.index=index;
			result[item[key]]=[obj];
		}else{
			var obj=$.extend(true,{},item);
			obj.index=index;
			result[item[key]].push(obj);
		};
	});

	return result;
};

function reverseMatrix(matrix){
	var array=[];
	array.length=matrix[0].length;

	$.each(array,function(index,item){
		array[index]=[];
		array[index].length=matrix.length;

		$.each(array[index],function(_index,_item){
			array[index][_index]=matrix[_index][index];
		});
	});

	return array;
};


function ChironDrag($trigger){
	var that=this;

	this.$trigger=$trigger;

	this.moving=false;
	this.offsetX;this.offsetY;
	this.originX;this.originY;

	this.init();
};

ChironDrag.prototype.init=function(){
	this.$trigger.addClass("chiron-dragable")
	this.mousedown();
	this.mouseup();
};

ChironDrag.prototype.mousedown=function(){
	var that=this;

	this.$trigger.off("mousedown").on("mousedown",function(e){
		if ( e.which!=1 ) return;

		e.stopPropagation();
		that.moving=true;

		that.originX=e.clientX;
		that.originY=e.clientY;
		that.offsetX=$(this).offset().left;
		that.offsetY=$(this).offset().top;

		$(this).css({"cursor":"move"});

		that.mousemove();
	});
};

ChironDrag.prototype.mousemove=function(){
	var that=this;

	this.$trigger.off("mousemove").on("mousemove",function(e){
		if ( that.moving ){
			var moveX=e.clientX-that.originX,
				moveY=e.clientY-that.originY;

			$(this).css({"left":moveX+that.offsetX,"top":moveY+that.offsetY,"position":"fixed"});
		};
	});
};

ChironDrag.prototype.mouseup=function(){
	var that=this;

	this.$trigger.off("mouseup").on("mouseup",function(e){
		if ( e.which!=1 ) return;

		var moveX=e.clientX-that.originX,
			moveY=e.clientY-that.originY;

		$(this).css({"position":"inherit"});

		moving=false;

		$(this).css({"cursor":"auto"});

		$(this).off("mousemove");

		that.$trigger.trigger("dragStop:chrionDrag",moveY);
	});
};

function ChironPagination(trigger,options){
	var that=this;

	this.$trigger=$(trigger);
	this.options=options;

	this.init();
};

ChironPagination.DEFAULTS={
	prevText:"上一页",
	nextText:"下一页",
	firstText:"第一页",
	lastText:"最后一页",
	perPageItemsText:"条数据每页",
	startPage:1,
	enablePages:10,// How much pages can be selected.
	perPageItems:10,// How much items per page has.
	showPerPageItems:true,
	slide:"client",
	href:false,
	ajax:true,
	url:"",
	method:"post",
	cache:true,
	dataType:"json",
	contentType:"application/json",
	queryParam:{},
	handlerData:function(data){
		return data;
	},// Handler per page's data.
	success:function(res){
		return res;
	},
	error:function(res){
		return res;
	}
};

ChironPagination.prototype.init=function(){
	this.valOptions();

	if ( this.options.slide=="server" ){
		this.initServer();
	}else{
		this.initData();
	};
	
	this.initPagination();
	this.updatePagination();
};

ChironPagination.prototype.valOptions=function(){
	var that=this;

	if ( that.options.href && that.options.ajax ){
		throw new Error("Config href and ajax can't be true together.")
	};
};

ChironPagination.prototype.initServer=function(currentPage){
	var that=this,
		data=that.options.queryParam;

	that.options.currentPage=currentPage?currentPage:that.options.startPage;

	data=$.extend(true,data,{
		offset:(that.options.currentPage-1)*that.options.perPageItems,
		limit:that.options.perPageItems
	});

	$.ajax({
		url:that.options.url,
		type:that.options.method,
      	data: this.options.contentType==='application/json' && this.options.method==='post' ?
          	JSON.stringify(data):data,
      	cache: this.options.cache,
		content:that,
		contentType:that.options.contentType,
		success:function(res){
			var that=this;
			that.options.totalPage=res.total;
			that.options.groupData[currentPage]=res.rows;
			that.$trigger.trigger("success:chironPagination",res);
			that.updatePagination(currentPage);
		},
		error:function(res){
			var that=this;
			that.options.error(res);
			that.$trigger.trigger("error:chironPagination",res);
		}
	});
};

ChironPagination.prototype.initData=function(){
	var that=this;

	this.options.groupData={};

	for (var i=0;i<this.options.data.length;i+=this.options.perPageItems){
		var j=parseInt(i/this.options.perPageItems);
		this.options.groupData[j]=this.options.data.slice(i,i+this.options.perPageItems);
	};

	this.options.totalPage=Object.keys(this.options.groupData).length;
};

ChironPagination.prototype.initPagination=function(){
	var that=this;

	that.$trigger.addClass("chiron-pagination clearfix");

	that.$pagination=$("<ul class='pagination pull-right'></ul>")
		.appendTo(that.$trigger);

	that.renderTips();
};

ChironPagination.prototype.renderTips=function(){
	var that=this;

	that.$tips=$("<div class='chiron-pagination-tips pull-left' style='margin:20px 0'></div>").prependTo(that.$trigger);

	if ( that.options.showPerPageItems ){
		that.$tips.append("<select class='form-control chiron-pagination-item-num' style='display:inline;width:80px;'>"+
			"<option value='10'>10</option>"+"<option value='25'>25</option>"+
			"<option value='50'>50</option>"+"<option value='100'>100</option>"+
			"<option value='ALL'>ALL</option>"+"</selcet>")
			.append("<span>&nbsp;"+that.options.perPageItemsText+"</span>");

		if ( [10,25,50,"All"].indexOf(that.options.perPageItems)==-1 ){
			that.$tips.find(".chiron-pagination-item-num")
				.append("<option value='"+that.options.perPageItems+"'>"+that.options.perPageItems+"</option>");
		};

		that.$tips.find(".chiron-pagination-item-num").val(that.options.perPageItems);

		that.$tips.find(".chiron-pagination-item-num").on("change",function(){
			that.options.perPageItems=$(this).val()=="ALL"?that.options.data.length:$(this).val();
			that.initData();
			that.updatePagination();
		});
	};
};

ChironPagination.prototype.updatePagination=function(currentPage){
	var that=this;

	this.options.currentPage=currentPage?currentPage:this.options.startPage;

	if ( this.options.currentPage!=this.options.startPage ){
		this.options.prev=true;
	}else{
		this.options.prev=false;
	};

	if ( this.options.currentPage!=this.options.totalPage+this.options.startPage-1 ){
		this.options.next=true;
	}else{
		this.options.next=false;
	};

	if ( this.options.currentPage!=this.options.startPage ){
		this.options.first=true;
	}else{
		this.options.first=false;
	};

	if ( this.options.currentPage!=this.options.startPage+this.options.totalPage-1 ){
		this.options.last=true;
	}else{
		this.options.last=false;
	};

	this.options.pageIcons=[];

	if ( this.options.totalPage<=this.options.enablePages && this.options.totalPage<=7 ){
		for (var i=0;i<this.options.totalPage;i++){
			that.options.pageIcons.push(i+this.options.startPage);
		};
	};

	if ( this.options.totalPage>this.options.enablePages && this.options.enablePages<=7 ){
		if ( this.options.currentPage-this.options.startPage+1-parseInt(this.options.enablePages/2)<1 ){
			var startPage=1,
				endPage=startPage+this.options.enablePages-1;

			for (var i=startPage;i<=endPage;i++ ){
				that.options.pageIcons.push(i+this.options.startPage-1);
			};
		};
		if ( this.options.currentPage-this.options.startPage+1-parseInt(this.options.enablePages/2)>this.options.totalPage ){
			var endPage=this.options.totalPage,
				startPage=endPage-this.options.enablePages+1;

			for (var i=startPage;i<=endPage;i++ ){
				that.options.pageIcons.push(i+this.options.startPage-1);
			};
		};
		if ( this.options.currentPage-this.options.startPage+1-parseInt(this.options.enablePages/2)>=1 && 
				this.options.currentPage-this.options.startPage+1-parseInt(this.options.enablePages/2)<=this.options.totalPage ){
			var startPage=this.options.currentPage-parseInt(this.options.enablePages/2),
				endPage=startPage+this.options.enablePages-1;

			for (var i=startPage;i<=endPage;i++ ){
				that.options.pageIcons.push(i+this.options.startPage-1);
			};
		};
	};

	if ( this.options.totalPage>=this.options.enablePages && this.options.enablePages>7 ){
		if ( this.options.currentPage<4+this.options.startPage ){
			for (var i=0;i<5;i++){
				that.options.pageIcons.push(i+this.options.startPage);
			};
			that.options.pageIcons.push("...");
			that.options.pageIcons.push(that.options.totalPage+this.options.startPage-1);
		};
		if ( this.options.currentPage>this.options.totalPage+this.options.startPage-4 ){
			that.options.pageIcons.push(this.options.startPage);
			that.options.pageIcons.push("...");
			for (var i=0;i<5;i++){
				that.options.pageIcons.push(that.options.totalPage-5+i+this.options.startPage);
			};
		};
		if ( this.options.currentPage>=4+this.options.startPage 
				&& this.options.currentPage<=this.options.totalPage+this.options.startPage-4 ){
			that.options.pageIcons.push(this.options.startPage);
			that.options.pageIcons.push("...");
			for (var i=0;i<3;i++){
				that.options.pageIcons.push(that.options.currentPage-2+i+this.options.startPage);
			};
			that.options.pageIcons.push("...");
			that.options.pageIcons.push(that.options.totalPage+this.options.startPage-1);
		};
	};

	this.renderPagination();
};

ChironPagination.prototype.renderPagination=function(){
	var that=this,
		href=that.options.href?that.options.href:"javascript:void(0)";

	if ( this.options.first && this.options.firstText!="" && this.$first==undefined ){
		this.$first=$('<li><a href="'+href+'" class="prev">'+that.options.firstText+'</a></li>')
			.appendTo(that.$pagination);
		this.$first.off("click").on("click",function(){
			if ( that.options.slide=="client" ){
				that.updatePagination(that.options.startPage);
			}else{
				if ( that.options.ajax ) that.initServer(that.options.startPage);
			};
		});
	};
	if ( !this.options.first && this.$first!=undefined ){
		this.$first.remove();
		delete this.$first;
	};

	if ( this.options.prev && this.options.prevText!="" && this.$prev==undefined ){
		this.$prev=$('<li><a href="'+href+'" class="prev">'+that.options.prevText+'</a></li>')
			.appendTo(that.$pagination);
		this.$prev.off("click").on("click",function(){
			if ( that.options.slide=="client" ){
				that.updatePagination(that.options.currentPage-1);
			}else{
				if ( that.options.ajax ) that.initServer(that.options.currentPage-1);
			};
		});
	};
	if ( !this.options.prev && this.$prev!=undefined ){
		this.$prev.remove();
		delete this.$prev;
	};

	if ( this.$pageIcons!=undefined ){
		$.each(that.$pageIcons,function(index,$page){
			$page.remove();
		});
		delete this.$pageIcons;
	};

	this.$pageIcons=[];
	$.each(that.options.pageIcons,function(index,page){
		if ( page==that.options.currentPage ){
			var $page=$('<li class="active"><a href="'+href+'">'+page+'</a></li>')
				.appendTo(that.$pagination);
		}else{
			var $page=$('<li><a href="'+href+'">'+page+'</a></li>')
				.appendTo(that.$pagination);
		};

		if ( page!="..." ){
			$page.off("click").on("click",function(){
				that.updatePagination(page);
				if ( that.options.slide=="client" ){
					that.updatePagination(page);
				}else{
					if ( that.options.ajax ) that.initServer(page);
				};
			});
		};

		that.$pageIcons.push($page);
	});

	if ( this.options.next && that.options.nextText!="" && this.$next==undefined ){
		this.$next=$('<li><a href="'+href+'" class="prev">'+that.options.nextText+'</a></li>')
			.appendTo(that.$pagination);
		this.$next.off("click").on("click",function(){
			if ( that.options.slide=="client" ){
				that.updatePagination(that.options.currentPage+1);
			}else{
				if ( that.options.ajax ) that.initServer(that.options.currentPage+1);
			};
		});
	};
	if ( !this.options.next && this.$next!=undefined ){
		this.$next.remove();
		delete this.$next;
	};

	if ( this.options.next && this.$next!=undefined ){
		this.$next.appendTo(that.$pagination);
	};

	if ( this.options.last && that.options.lastText!="" && this.$last==undefined ){
		this.$last=$('<li><a href="'+href+'" class="prev">'+that.options.lastText+'</a></li>')
			.appendTo(that.$pagination);
		this.$last.off("click").on("click",function(){
			if ( that.options.slide=="client" ){
				that.updatePagination(that.options.totalPage+that.options.startPage-1);
			}else{
				if ( that.options.ajax ) that.initServer(that.options.totalPage+that.options.startPage-1);
			};
		});
	};
	if ( !this.options.last && this.$last!=undefined ){
		this.$last.remove();
		delete this.$last;
	};

	if ( this.options.last && this.$last!=undefined ){
		this.$last.appendTo(that.$pagination);
	};

	that.options.handlerData(that.options.groupData[that.options.currentPage-1]);
};

ChironPagination.prototype.getCurrentPage=function(){
	var that=this;

	return that.currentPage;
};

ChironPagination.prototype.getCurrentData=function(){
	var that=this;

	return that.options.groupData[that.currentPage];
};

ChironPagination.prototype.getPageData=function(page){
	var that=this;

	return that.options.groupData[page];
};

ChironPagination.prototype.destroy=function(){
	var that=this;

	that.$trigger.html("");
	that.$trigger.removeClass("chiron-pagination");
	that.$trigger.removeData("chiron-pagination");
	return that.$trigger;
};

var paginationallowedMethods=["getCurrentPage","getCurrentData","destroy"];

$.prototype.chironPagination=function(option){
	if ( this[0].nodeName!= "DIV" ){
		throw new Error("Supported Element Is Only DIV.")
	};

	var that=this,
		value,
		args=Array.prototype.slice.call(arguments, 1),
		data=$(this).data("chiron-pagination"),
		htmlOptions={};

	$.each(ChironPagination.DEFAULTS,function(key){
		htmlOptions[key]=$(that).data()[key];
	});

	options=$.extend({},ChironPagination.DEFAULTS,htmlOptions,typeof option==='object' && option);

	// If options's type is string,execute the corresponding method of ChironPagination instance.
	if ( typeof option=="string" ){
			if ( $.inArray(option,paginationallowedMethods)<0 ) {
      		throw new Error("Unknown method: "+option);
    	};

	    if ( !data ){
	      	return;
	    };

    	value=data[option].apply(data, args);

	    if (option==='destroy') {
	      	$(this).removeData('chiron-pagination');
	    };
	};

	// If the current options is different from the previous options,and options'type is object,
	// then create another ChironPagination instance.
	if ( data && $.type(data)=="object" && $.type(option)=="object" ){
		if ( !equal(data.originOptions,options) ){
			data.destroy();
			$(this).removeData('chiron-pagination');
			$(this).data('chiron-pagination', (data=new ChironPagination(this, options)));
		};
	};

	// If there is no ChironPagination instance,create it.
	if ( !data ){
		$(this).data('chiron-pagination',(data=new ChironPagination(this, options)));
	};

	// Return dom object or the result of ChironPagination instance method.
	return typeof value=='undefined' ? $(this) : value;
};

/*   jQuery chironTable plugin   */
$.prototype.chironTable=function(option){
	var that=this,
		value,
		args=Array.prototype.slice.call(arguments, 1),
		data=$(this).data("chiron-table"),
		htmlOptions={};

	$.each(ChironTable.DEFAULTS,function(key){
		htmlOptions[key]=$(that).data()[key];
	});

	options=$.extend({},ChironTable.DEFAULTS,htmlOptions,typeof option==='object' && option);

	// If options's type is string,execute the corresponding method of ChironTable instance.
	if ( typeof option=="string" ){
			if ( $.inArray(option,allowedMethods)<0 ) {
      		throw new Error("Unknown method: "+option);
    	};

	    if ( !data ){
	      	return;
	    };

    	value=data[option].apply(data, args);

	    if (option==='destroy') {
	      	$(this).removeData('chiron-table');
	    };
	};

	// If the current options is different from the previous options,and options'type is object,
	// then create another ChironTable instance.
	if ( data && $.type(data)=="object" && $.type(option)=="object" ){
		if ( !equal(data.originOptions,options) ){
			data.destroy();
			$(this).removeData('chiron-table');
			$(this).data('chiron-table', (data=new ChironTable(this, options)));
		};
	};

	// If there is no ChironTable instance,create it.
	if ( !data ){
		$(this).data('chiron-table',(data=new ChironTable(this, options)));
	};

	// Return dom object or the result of ChironTable instance method.
	return typeof value=='undefined' ? $(this) : value;
};

function equal(objA,objB){
	if ( $.type(objA) != $.type(objB) ) return false;

	switch($.type(objA)){
		case "string":
			if ( $.type(objB)!="string" && $.type(objB)!="number" ) return false;

			return objA==String(objB);

		case "number":
			if ( $.type(objB)!="string" && $.type(objB)!="number" ) return false;
			return objA==Number(objB);

		case "array":
			if ( $.type(objB)!="array" ) return false;

			if ( objA.length!=objB.length ) return false;

			var isEqual=true;

			$.each(objA,function(index,item){
				if ( !equal(item,objB[index]) ) isEqual=false;
			});

			return isEqual;

		case "function":
			if ( $.type(objB)!="function" ) return false;

			return objA.toString()==objB.toString();

		case "object":
			if ( $.type(objB)!="object" ) return false;

			var isEqual=true;

			$.each(objA,function(key,value){
				if ( objB[key]==undefined ) isEqual=false;
			});

			$.each(objB,function(key,value){
				if ( objA[key]==undefined ) isEqual=false;
			});

			$.each(objA,function(key,value){
				if (!equal(value,objB[key])) isEqual=false;
			});

			return isEqual;
		default:
			return objA==objB;
	};
};

});