hxlBites._mapBites = [{
'id':'map0001',
'type':'map',
'subType':'choropleth',
'ingredients':[{'name':'where','tags':['#country+code','#adm1+code']},{'name':'value','tags':['#value','#affected','#indicator']}],
'criteria':['where > 0','value ! 0'],
'variables': ['where', 'count()'],
'map':'',
'title':'Count of reports',
'priority': 10,
},
{
'id':'map0002',
'type':'map',
'subType':'choropleth',
'ingredients':[{'name':'where','tags':['#country+code','#adm1+code']},{'name':'value','tags':['#value','#affected','#indicator']}],
'criteria':['where > 0'],
'variables': ['where', 'sum(value)'],
'map':'',
'title':'Map of {2}',
'priority': 10,
}];

hxlBites._mapValues = [
	{'name':'world_0','level':0,'url':'world.json','codes':[
			{'name':'ISO_A3','values':['ABW','AFG','AGO','AIA','ALB','ALD','AND','ARE','ARG','ARM','ASM','ATA','ATC','ATF','ATG','AUS','AUT','AZE','BDI','BEL','BEN','BFA','BGD','BGR','BHR','BHS','BIH','BLM','BLR','BLZ','BMU','BOL','BRA','BRB','BRN','BTN','BWA','CAF','CAN','CHE','CHL','CHN','CIV','CMR','COD','COG','COK','COL','COM','CPV','CRI','CUB','CUW','CYM','CYN','CYP','CZE','DEU','DJI','DMA','DNK','DOM','DZA','ECU','EGY','ERI','ESP','EST','ETH','FIN','FJI','FLK','FRA','FRO','FSM','GAB','GBR','GEO','GGY','GHA','GIN','GMB','GNB','GNQ','GRC','GRD','GRL','GTM','GUM','GUY','HKG','HMD','HND','HRV','HTI','HUN','IDN','IMN','IND','IOA','IOT','IRL','IRN','IRQ','ISL','ISR','ITA','JAM','JEY','JOR','JPN','KAS','KAZ','KEN','KGZ','KHM','KIR','KNA','KOR','KOS','KWT','LAO','LBN','LBR','LBY','LCA','LIE','LKA','LSO','LTU','LUX','LVA','MAC','MAF','MAR','MCO','MDA','MDG','MDV','MEX','MHL','MKD','MLI','MLT','MMR','MNE','MNG','MNP','MOZ','MRT','MSR','MUS','MWI','MYS','NAM','NCL','NER','NFK','NGA','NIC','NIU','NLD','NOR','NPL','NRU','NZL','OMN','PAK','PAN','PCN','PER','PHL','PLW','PNG','POL','PRI','PRK','PRT','PRY','PSX','PYF','QAT','ROU','RUS','RWA','SAH','SAU','SDN','SDS','SEN','SGP','SGS','SHN','SLB','SLE','SLV','SMR','SPM','SRB','STP','SUR','SVK','SVN','SWE','SWZ','SXM','SYC','SYR','TCA','TCD','TGO','THA','TJK','TKM','TLS','TON','TTO','TUN','TUR','TWN','TZA','UGA','UKR','URY','USA','UZB','VAT','VCT','VEN','VGB','VIR','VNM','VUT','WLF','WSM','YEM','ZAF','ZMB','ZWE','SOM']}
		]
	},
		{'name':'indonesia_1','level':1,'url':'https://s3.amazonaws.com/itos-humanitarian/IDNAdmin1.json','codes':[
			{'name':'admin1Pcod','values':['ID11','ID51','ID36','ID17','ID34','ID31','ID75','ID15','ID32','ID33','ID35','ID61','ID63','ID62','ID64','ID65','ID19','ID21','ID18','ID81','ID82','ID52','ID53','ID94','ID91','ID14','ID76','ID73','ID72','ID74','ID71','ID13','ID16','ID12']}
		]
	}
];