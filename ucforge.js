/**
 * --------added by Yx at 170317----
 * $('ele').attrs()
 * $('ele').ucattrs()
 * css class: bg-default
 * window.ucrender(html) for replace current document in javascript
 * 
 * -------modified by Yx at 170317----
 * window.ucError(xhr) for debuging
 */
$.fn.extend({
	attrs: function(){
		var atts=$(this)[0].attributes;
		var arr=[];
		for(var i in atts) {
			if(atts.hasOwnProperty(i)) {
				arr.push(atts[i].name);
			}
		}
		return arr;
	},
	ucattrs: function(){
		var jObj=$(this);
		var atts=$(this).attrs();
		var ucatts=[];
		var ucobjs={};

		atts.forEach(function(value){
			if(value.indexOf('ucdata-') === 0) {
				var field=value.slice(7); // 去掉ucdata-前缀
				ucatts.push(field);
				var ucobj=eval('({'+field+':jObj.attr(value)})'); 
				$.extend(ucobjs,ucobj);
			}
		});
		//return ucatts;
		return ucobjs;
	}
}); $.extend(window,{
	// 全局变量
	ucPageContext: {
		khHandleLeft: null,
		khHandleRight: null,
		csHandleLeft: null,
		csHandleRight: null,
		clHandle: null,
		wlRowHandle: null,
		wlcount: 1, // 物料行数
		selectedItemId: 0, // 列表项选中id
		historyApi: '', // 历史 url 
		waitingHtml: '<tr><td class="text-center"><i class="ace-icon fa fa-spinner fa-spin orange bigger-125"></i></td></tr>'
	},
	ucinit: function() {
		ucPageContext.historyApi=window.location.href;
		ucPageContext.khHandleLeft=$('#select-kh-btn-left');
		ucPageContext.khHandleRight=$('#select-kh-btn-right');
		
		ucPageContext.csHandleLeft=$('#select-cs-btn-left');
		ucPageContext.csHandleRight=$('#select-cs-btn-right');

		ucPageContext.clHandle=$('#select-cl-btn-right');

		ucPageContext.wlbaseHandleLeft=$('#select-wlbase-btn-right');
		ucPageContext.jhHandleRight=$('#select-jh-btn-right');

		ucPageContext.wlbaseHandleLeft.on('click',function(){
			ucGetWlbase();
			ucOneDblclickUni();
		});

		ucPageContext.jhHandleRight.on('click',function(){
			ucGetJh();
			ucOneDblclickUni();
		});

		ucPageContext.khHandleLeft.on('click',function(){
			ucGetKh();
			ucOneDblclickMulti();
		});
		ucPageContext.khHandleRight.on('click',function(){
			ucGetKh();
			ucOneDblclickUni();
		});
		ucPageContext.csHandleLeft.on('click',function(){
			ucGetCs();
			ucOneDblclickMulti();
		});
		ucPageContext.csHandleRight.on('click',function(){
			ucGetCs();
			ucOneDblclickUni();
		});
		ucPageContext.clHandle.on('click',function(){
			ucGetCl();
			ucOneDblclickUni();
		});
		$('#select-clear-btn-left').on('click',appClearSelectBoxLeft);
		$('body').delegate('form[useajax]','submit',ajaxFormHandler); // ajaxform
		$('body').delegate('a[useajax]','click',ajaxLinkHandler); // ajaxlink

		if($('#myWldata').length === 1) {
			// 选择物料
			$("#myWldata").delegate("a[role=selectWl]","click",appWlGrid.AddWlRow);
			// 删除物料
			$("#myWldata").delegate("a[role=deleteRow]","click",appWlGrid.DeleteWlRow);	
			appWlGrid.InsertFirstRow();
			appCalculate.init();
		}

		appCrud.init();
	},
	ucalert: function(str,style) {
		var style = style || "primary";
		$("#_ucalert").find(".modal-header").removeAttr("class").addClass("modal-header bg-"+style);
		$("#_ucalert").find(".modal-body").html('<div class="text-'+style+'">'+str+'</div>');
		$("#_ucalert").find(".modal-footer").find("button").removeAttr("class").addClass("btn btn-"+style+" btn-xs");
		$("#_ucalert").modal();
	},
	ucconfirm: function(str,style) {
		var style = style || "primary";
		$("#_ucconfirm").find(".modal-header").removeAttr("class").addClass("modal-header bg-"+style);
		$("#_ucconfirm").find(".modal-body").html('<div class="text-'+style+'">'+str+'</div>');
		$("#_ucconfirm").find(".modal-footer").find("button").removeAttr("class").addClass("btn btn-"+style+" btn-xs");
		$("#_ucconfirm").modal();
		$("#confirmsure").one("click", 
		function clickSureButton() {
			$("#_ucconfirm").modal("hide");
			var _url=window.location.href+'_delete?id='+ucPageContext.selectedItemId;
			$.ajax(
			{
				url:_url,type:'get',dataType:'json',
				success:function afterClickSureButton(obj) {
					if(obj.error) {
						ucalert(obj.msg,'danger');
					}else{
						ucalert(obj.msg,'success');
						ucreload();
					}
				},
				error: function errorClickSureButton(xhr,status,err){
					ucalert(err,'danger');
				}
			}
			);
		});

		$("#_ucconfirm").on("hide.bs.modal",function(){
			$("#confirmsure").off("click");
		});
	},
	ucmodal: {
		modal: $("#_ucmodal"),
		titleDom: $("#_ucmodal").find(".modal-title"),
		bodyDom: $("#_ucmodal").find(".modal-body"),
		setTitle: function(title) {
			ucmodal.titleDom.html(title);
			return ucmodal;
		},
		setTitleBg: function(style) {
			ucmodal.titleDom.parent()
				.removeAttr('class')
				.addClass('modal-header bg-'+style);
			return ucmodal;
		},
		setText: function(text) {
			ucmodal.bodyDom.html(text);
			return ucmodal;
		},
		setUrl: function(url) {
			ucmodal.bodyDom.load(url);
			return ucmodal;
		},
		show: function() {
			ucmodal.modal.modal();
		},
		close: function() {
			ucmodal.modal.modal('hide');
		}
	},
	ajaxFormHandler: function() {
		var target=$('#'+$(this).attr('data-goal'));
		target.html(ucPageContext.waitingHtml)
		$(this).ajaxSubmit({
			url: $(this).prop('action'),
			type: 'get',
			dataType: 'html',
			success: function renderSearchResults(resHtml) {
				target.html(resHtml);
				return false;
			},
			error: ucError
		});
		
		return false; // 阻止默认提交
	},
	ajaxLinkHandler: function() {
		var target=$('#'+$(this).attr('data-goal'));
		target.html(ucPageContext.waitingHtml)
		target.load($(this).prop('href'));
		return false; // 阻止默认跳转	
	},
	// 详细信息
	ucRenderDetail: function(item) {
		var detailForm=$("#detailform");
		detailForm.find("input[role=editid]").prop('name','id');
		for(var name in item) {
			if(item.hasOwnProperty(name)) {
				var node=detailForm.find(':input[name='+name+']');
				if(['text','hidden'].indexOf(node.prop('type')) !== -1) {
					node.val(item[name]);
				}
				if(node.prop('type') === 'radio'){ // radio的赋值比较繁琐
					node.each(
					function checkRadio() {
						if($(this).val() == item[name]) {
							this.checked=true;
						}
					});
				}
				if(node.length>0 && node[0].nodeName==='SELECT'){
					node.find("option").each( // select 的赋值比较繁琐
					function selectOption() { 
						if($(this).val()===item[name]) {
							$(this).prop('selected','selected');
						}
					});
				}
				if(node.length>0 && node[0].nodeName==='TEXTAREA'){
					node.val(item[name]);
				}
				if(node.length>0 && node[0].type==='date') {
					node.prop('value',item[name]); // 日期不用val()赋值
				}
			}
		}
		if(item['wl']) {
			appWlGrid.doRenderDetailRow(item['wl']);
		}
		detailForm.find(':input').prop('disabled','disabled');
		$("#detailLoadingHint").hide();
	},	
	// 分页回调
	ucPaginateAction: function(_list) {
		if($.type(_list)==="string") {
			try{
				list=JSON.parse(_list); // 有时来JSON对象，有时来JSON字串，很错乱
			}catch(except){
				ucmodal.setTitle('出錯了！').setTitleBg('warning').setText(_list).show();
				return false;
			}
		}
		$("#firstPage").attr("data-href",list.firstPageUrl);
		$("#lastPage").attr("data-href",list.lastPageUrl);
		$("#nextPage").attr("data-href",list.nextPageUrl);
		$("#previousPage").attr("data-href",list.previousPageUrl);
		$("#currentPage").html(list.currentPage);
		$("#totalPage").html(list.totalPage);
		var container=$("#myListdata");
		container.html("").html(list.table);
	},
	// 错误回调 
	ucError: function(xhr) {
		var err='頁面出錯！'+xhr.statusText+' '+xhr.status+' &nbsp;'; 
		err+='<a class="text-danger" onclick="$(this).next().toggle();">[點擊查看錯誤信息]</a>';
		err+='<div style="display:none;margin-top:10px;">';
		err+=xhr.responseText;
		err+='</div>';
		var title='<i class="ace-icon fa fa-exclamation-circle text-danger">&nbsp;錯誤提示</i>';
		title+='&nbsp;<a class="pull-right" onclick="ucmodal.close();">[關閉]</a>';
		ucmodal.setTitle(title).setTitleBg('warning')
			   .setText(err)
			   .show();
		console.clear();
	},
	ucDump: function(data) {
		var Info='<p>頁面調試!</p>'; 
		Info+=data;
		var title='<i class="ace-icon fa fa-cog text-danger">&nbsp;頁面調試</i>';
		title+='&nbsp;<a class="pull-right" onclick="ucmodal.close();">[關閉]</a>';
		ucmodal.setTitle(title).setTitleBg('warning')
			   .setText(Info)
			   .show();
		console.clear();
	},
	ucOneDblclickUni: function() {
		$('#_ucmodalbody').on('dblclick','#SubDataList tr',function(){
			var data=$(this).ucattrs();
			for(var field in data) {
				$('#detailform input[name='+field+']').val(data[field]);
			}
			ucmodal.close();		
		});
	},
	ucOneDblclickMulti: function() {
		$('#_ucmodalbody').on('dblclick','#SubDataList tr',function(){
			var data=$(this).ucattrs();
			var old_str=$('#csoutput').val();

			for(var key in data) {
				if(key.indexOf('id') !== -1) {
					$('#listSearchForm').append('<input type="hidden" name='+key+'[] value="'+data[key]+'" />');
				}
				
				if(key.indexOf('name') !== -1) {
					if(old_str) {
						$('#csoutput').val([old_str,data[key]].join(','));
					}else{
						$('#csoutput').val(data[key]);
					}					
				}
			}
			
			ucmodal.close();		
		});
	},
	appClearSelectBoxLeft: function() {
		$('#csoutput').val('');
		$('#listSearchForm input[name^=csid]').remove();
		$('#listSearchForm input[name^=khid]').remove();
		ucPageContext.csSelectedCount=0;
		ucPageContext.khSelectedCount=0;
	},
	ucRender: function(html) {
		var page=document.open('text/html','replace');
		page.write(html);
		page.close();
	},
	// 刷新页面
	ucreload: function(_url) {
		var url = _url || ucPageContext.historyApi;
		$.ajax(
		{
			url: url,type:'get',dataType:'json',
			success: ucPaginateAction,
			error: ucError
		}
		);		
	},
	appWlGrid: {
		doCreateWlRow: function() {
			//console.log('物料行标：'+ucPageContext.wlcount);
			var newLine=$("#wlrow").clone(true);
			newLine=newLine.find("tbody tr");
			newLine.find('td[role=sort]').html(ucPageContext.wlcount);
			cells=newLine.find("td");
			cells.each(function renderNewLine(){
				var name=$(this).attr("role");
				$(this).find("input").prop('name','wl['+ucPageContext.wlcount+']['+name+']');
			});	
			newLine.find('td[role=wlname]').find('[role=input]').append('<input type="hidden" name=wl['+ucPageContext.wlcount+'][wlid]>');
			newLine.find('td[role=wlname]').find('[role=input]').append('<input type="hidden" name=wl['+ucPageContext.wlcount+'][wlname]>');
			ucPageContext.wlcount++;
			return newLine;	
		},
		DeleteWlRow: function() {
			// 保护选择行
			var length=$("#myWldata").find("tr").length;
			if(length >= 1) {
				if($(this).parents('tr').find('td[role=wlname]').find('a').length===1) {
					if($('#myWldata').find('tr td[role=wlname]').find('a').length === 1)  
					{
						return false;
					}
				}
			} 
			$(this).parents("tr").remove();
			
			appWlGrid.reRenderRowNo();

			appCalculate.calcRenderAmount();
		},
		reRenderRowNo: function() {
			// 序號重排
			var count=1;
			$("#myWldata").find("td[role=sort]").each(function(){
				$(this).html(count);
				count++;
			});	
		},
		AddWlRow: function() {
			ucGetKcWl();
			ucPageContext.wlRowHandle=$(this).parents('tr');

			$('#_ucmodalbody').on('dblclick','#SubDataList tr',function(){
				var data=$(this).ucattrs();
				appWlGrid.doInsertNewRow(data);
				ucmodal.close();		
			});
		},
		doInsertNewRow: function(data) {
			for(var field in data) {
				ucPageContext.wlRowHandle.find('td[role='+field+']').find('input').val(data[field]);
			}
			ucPageContext.wlRowHandle.find('td[role=wlname]').find('input').eq(0).val(data['wlid']);
			ucPageContext.wlRowHandle.find('td[role=wlname]').find('[role=output]').html(data.wlname);
			ucPageContext.wlRowHandle.find('td[role=jhno] span[role=output]').html(data.jhno);

			var newLine=appWlGrid.doCreateWlRow(); // 生成新行
			$("#myWldata").append(newLine);

			newLine.find('td[role=cj]').find('input').trigger('keyup'); // 第一次計算

			var n=$("#myWldata");
			var c=n.parents("div");
			c.scrollTop(n.height() - 200 + 30); // 向下滾動一行

			appWlGrid.reRenderRowNo();
		},
		doRenderDetailRow: function(data) {	
			$("#myWldata").html('');
			data.forEach(function(row){
				var newLine=appWlGrid.doCreateWlRow();
				for(var key in row) {
					newLine.find('td[role='+key+']').find('input').val(row[key]);
				}
				newLine.find('td[role=wlname]').find('input').eq(0).val(row['wlid']);
				newLine.find('td[role=wlname]').find('[role=output]').html(row['wlname']);
				newLine.find('td[role=jhno] span[role=output]').html(row['jhno']);	

				$("#myWldata").append(newLine);			
			});
			
			appWlGrid.InsertFirstRow();
			appWlGrid.reRenderRowNo();
		},
		InsertFirstRow: function() {
			var newLine=appWlGrid.doCreateWlRow(); // 生成新行
			$("#myWldata").append(newLine);
			appWlGrid.reRenderRowNo();
		},
	},
	appCalculate: {
		init: function() {
			appCalculate.monitorWeight().monitorPrice().monitorIsse();
		},
		monitorWeight: function() {
			if($('#myWldata').length===0) { return false; }
			$("#myWldata").on("keyup","td[role=dj],td[role=tj]",function(){
				var row=$(this).parents('tr');
				var dj=row.find('td[role=dj]').find('input').val();
				var tj=row.find('td[role=tj]').find('input').val();
				var jinz=row.find('td[role=jinz]').find('input').val();

				var cjj=ucNumber(dj)-ucNumber(tj);
				row.find('td[role=cj]').find('input').val(cjj); // 成交價
				var cje=Number(cjj) * Number(jinz);
				row.find('td[role=cje]').find('input').val(cje.toFixed(2)); // 成交額
				appCalculate.calcRenderAmount();
			});
			return appCalculate;
		},
		monitorPrice: function() {
			if($('#myWldata').length===0) { return false; }
			$("#myWldata").on("keyup","td[role=zz],td[role=kongz],td[role=kouz_s],td[role=kouz_z1],td[role=kouz_z2]",function(){
				var row=$(this).parents('tr');
				
				var zz=row.find('td[role=zz]').find('input').val();
				var kongz=row.find('td[role=kongz]').find('input').val();
				var kouz_s=row.find('td[role=kouz_s]').find('input').val();
				var kouz_z1=row.find('td[role=kouz_z1]').find('input').val();
				var kouz_z2=row.find('td[role=kouz_z2]').find('input').val();

				var kouz=Number(kouz_s)+Number(kouz_z1)+Number(kouz_z2);
				row.find('td[role=kouz]').find('input').val(kouz); // 扣重
				var jinz=Number(zz)-Number(kongz)-Number(kouz);
				row.find('td[role=jinz]').find('input').val(jinz); // 淨重
				var cjj=row.find('td[role=cj]').find('input').val();
				var cje=Number(cjj) * Number(jinz);
				row.find('td[role=cje]').find('input').val(cje.toFixed(2)); // 成交額
				appCalculate.calcRenderAmount();
			});

			return appCalculate;
		},
		monitorIsse: function() {
			$('#detailform').find('input[name=isse]').on('change',appCalculate.calcRenderAmount);
			return appCalculate;
		},
		calcRenderAmount: function(row) {
			var rows=$('#myWldata').find('tr');
			var total=0;
			rows.each(function(){
				if($(this).find('td[role=wlname]').find('a').length===0) {
					var cje=$(this).find('td[role=cje]').find('input').val();
					total+=ucNumber(cje);
				}
			});

			var xhje=$('#detailform').find('input[name=xhje]');
			xhje.val(total);

			var isse=$('#detailform').find('input[name=isse]:checked').val() === '1';
			var _se=0;
			if(isse) {
				_se=total * ucNumber( 5 / 100 );
			}
			var se=$('#detailform').find('input[name=se]');
			se.val(_se);

			var _hsze=total + _se;
			var skje=$('#detailform').find('input[name=skje]');
			skje.val(_hsze);
			var hsze=$('#detailform').find('input[name=hsze]');
			hsze.val(_hsze);
		}
	},
	appCrud: {
		init: function() {
			$("a[role=ucadd],a[role=uccancel]").on("click",appCrud.resetDetailForm);
			$("a[role=ucedit]").on("click",appCrud.canEditDetailForm);
			$("a[role=ucdelete]").on("click",appCrud.deleteMainDataListItem);

			// 保存 
			$("a[role=ucsave]").on("click",function(){
				var form=$('#detailform');
				var isLegal=form.validationEngine('validate');
				if(!isLegal) {
					ucalert('表單沒通過驗證，無法提交！','danger');
					return false;
				}
				var _url=window.location.href+'_save';
				form.ajaxSubmit({
					url: _url,
					type: 'get',
					dataType: 'json',
					success: appCrud.saveDetailFormSuccess,
					error: ucError
				});			
			});
		},
		resetDetailForm: function() {
			ucPageContext.selectedItemId=0;
			$("#myListdata").find("tr").removeClass("bg-info");
			$("#detailform").find(':input').removeAttr('disabled');
			$("#detailform").find('input[role=editid]').removeAttr('name');
			$('a[role=ucedit],a[role=ucdelete]').parent().hide();
			$('a[role=ucadd]').parent().show();
			document.getElementById("detailform").reset();
			$('#pagerole_prompt').html('新增');
		},
		canEditDetailForm: function() {
			$("#detailform").find(':input').removeAttr('disabled');
			$('a[role=ucadd],a[role=ucedit],a[role=ucdelete]').parent().hide();
			$('#pagerole_prompt').html('修改');
		},
		saveDetailFormSuccess: function(data) {
			if($.type(data)==="string") {
				data=JSON.parse(data); 
			}
			if(data.error) {
				ucalert(data.msg,'danger');
			}else{
				ucalert(data.msg,'success');
			}
		},
		deleteMainDataListItem: function() {
			if(ucPageContext.selectedItemId===0) {
				ucalert('您沒有選擇要刪除的項.');
				return false;
			}
			ucconfirm('id '+ucPageContext.selectedItemId+'。刪除之後數據將不能恢復，確定要刪除嗎？','danger');			
		},
	},
	ucGetSubwin: function(title,url) {
		$("#_ucmodalbody").html(ucPageContext.waitingHtml);
		ucmodal.setTitle(title);
		ucmodal.setTitleBg('default');
		ucmodal.setUrl(url);
		ucmodal.show();
	},
	ucGetKcWl: function() {
		return ucGetSubwin('選擇銷貨物料的資料','/panel/getKcWl');
	},
	ucGetKh: function() {
		return ucGetSubwin('選擇客戶','/panel/getKh');
	},
	ucGetCl: function() {
		return ucGetSubwin('選擇車輛','/panel/getCl');
	},
	ucGetCs: function() {
		return ucGetSubwin('選擇客戶(廠商)','/panel/getCs');
	},
	ucGetWlbase: function() {
		return ucGetSubwin('選擇庫存的物料資料','/panel/getWlbase');
	},
	ucGetJh: function() {
		return ucGetSubwin('選擇進貨單資料','/panel/getJh');
	},
	ucListLoading: function() {
		$("#myListdata").html("").html(ucPageContext.waitingHtml);
	},
	ucNumber: function(value) {
		return Number(parseFloat(value));
	}
});

ucinit();
$('#_ucmodal').on('hide.bs.modal',function(){
	$('#_ucmodalbody').off('dblclick','#SubDataList tr');	
});

// 分页
$("a[role=paginate]").on("click",function(){
	var _url=$(this).attr("data-href");
	if(!_url) { return false; }
	ucListLoading();
	$.ajax(
	{
		url: _url,type:'get',dataType:'json',
		success: ucPaginateAction,
		error: ucError
	}
	);
	ucPageContext.historyApi=_url;
});

// 查询
$("#list-search-btn").on("click",function(){
	ucListLoading();
	var searchForm=$("#listSearchForm");
	var _url=searchForm.prop("action");
	var _type=searchForm.prop("method");
	searchForm.ajaxSubmit(
	{
		url: _url,
		type: 'get',
		success: ucPaginateAction,
		error: ucError
	}
	);
	ucPageContext.historyApi = window.location.href+'?'+searchForm.serialize();
});

// 列表单击
$("#myListdata").delegate("tr","click",function(){
	ucPageContext.selectedItemId=$(this).attr('data-id'); // <tr>标签一定加data-id属性
	$("#myListdata").find("tr").removeClass("bg-info");
	$(this).addClass("bg-info");
	var id=$(this).data('id');
	var _url=window.location.href+'_detail?id='+id;
	$("#detailLoadingHint").show();
	$.ajax(
	{
		url: _url,type:'get','dataType':'json',
		success: ucRenderDetail,
		error: ucError
	}
	);
	$('a[role=ucedit],a[role=ucdelete]').parents('li').show()
});
