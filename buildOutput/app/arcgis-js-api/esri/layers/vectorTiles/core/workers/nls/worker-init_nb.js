// COPYRIGHT © 201 Esri
//
// All rights reserved under the copyright laws of the United States
// and applicable international laws, treaties, and conventions.
//
// This material is licensed for use under the Esri Master License
// Agreement (MLA), and is bound by the terms of that agreement.
// You may redistribute and use this code without modification,
// provided you adhere to the terms of the MLA and include this
// copyright notice.
//
// See use restrictions at http://www.esri.com/legal/pdfs/mla_e204_e300/english
//
// For additional information, contact:
// Environmental Systems Research Institute, Inc.
// Attn: Contracts and Legal Services Department
// 380 New York Street
// Redlands, California, USA 92373
// USA
//
// email: contracts@esri.com
//
// See http://js.arcgis.com/3.26/esri/copyright.txt for details.

define("esri/layers/vectorTiles/core/workers/nls/worker-init_nb",{"dojo/cldr/nls/number":{scientificFormat:"#E0","currencySpacing-afterCurrency-currencyMatch":"[:^S:]",infinity:"∞",superscriptingExponent:"×",list:";",percentSign:"%",minusSign:"−","currencySpacing-beforeCurrency-surroundingMatch":"[:digit:]","decimalFormat-short":"000 bill","currencySpacing-afterCurrency-insertBetween":" ",nan:"NaN",plusSign:"+","currencySpacing-afterCurrency-surroundingMatch":"[:digit:]","currencySpacing-beforeCurrency-currencyMatch":"[:^S:]",currencyFormat:"¤ #,##0.00",perMille:"‰",group:" ",percentFormat:"#,##0 %","decimalFormat-long":"000 billioner",decimalFormat:"#,##0.###",decimal:",","currencySpacing-beforeCurrency-insertBetween":" ",exponential:"E",_localized:{}},"dojo/cldr/nls/gregorian":{"dateFormatItem-Ehm":"E h.mm a","days-standAlone-short":["sø.","ma.","ti.","on.","to.","fr.","lø."],"months-format-narrow":["J","F","M","A","M","J","J","A","S","O","N","D"],"field-second-relative+0":"nå","quarters-standAlone-narrow":["1","2","3","4"],"field-weekday":"Ukedag","dateFormatItem-yQQQ":"QQQ y","dateFormatItem-yMEd":"E d.MM.y","field-wed-relative+0":"onsdag denne uken","field-wed-relative+1":"onsdag neste uke","dateFormatItem-GyMMMEd":"E d. MMM y G","dateFormatItem-MMMEd":"E d. MMM",eraNarrow:["f.Kr.","fvt.","e.Kr.","vt"],"field-tue-relative+-1":"tirsdag sist uke","days-format-short":["sø.","ma.","ti.","on.","to.","fr.","lø."],"dateTimeFormats-appendItem-Day-Of-Week":"{0} {1}","dateFormat-long":"d. MMMM y","field-fri-relative+-1":"fredag sist uke","field-wed-relative+-1":"onsdag sist uke","months-format-wide":["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"],"dateTimeFormat-medium":"{1}, {0}","dayPeriods-format-wide-pm":"p.m.","dateFormat-full":"EEEE d. MMMM y","field-thu-relative+-1":"torsdag sist uke","dateFormatItem-Md":"d.M.","dayPeriods-format-abbr-am":"a.m.","dateTimeFormats-appendItem-Second":"{0} ({2}: {1})","dayPeriods-format-wide-noon":"noon","dateFormatItem-yMd":"d.M.y","field-era":"Tidsalder","dateFormatItem-yM":"M.y","months-standAlone-wide":["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"],"timeFormat-short":"HH.mm","quarters-format-wide":["1. kvartal","2. kvartal","3. kvartal","4. kvartal"],"dateFormatItem-yQQQQ":"QQQQ y","timeFormat-long":"HH.mm.ss z","field-year":"År","dateFormatItem-yMMM":"MMM y","dateTimeFormats-appendItem-Era":"{1} {0}","field-hour":"Time","months-format-abbr":["jan.","feb.","mar.","apr.","mai","jun.","jul.","aug.","sep.","okt.","nov.","des."],"field-sat-relative+0":"lørdag denne uken","field-sat-relative+1":"lørdag neste uke","timeFormat-full":"HH.mm.ss zzzz","dateTimeFormats-appendItem-Week":"{0} ({2}: {1})","field-day-relative+0":"i dag","field-thu-relative+0":"torsdag denne uken","field-day-relative+1":"i morgen","field-thu-relative+1":"torsdag neste uke","dateFormatItem-GyMMMd":"d. MMM y G","dateFormatItem-H":"HH","months-standAlone-abbr":["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"],"quarters-format-abbr":["K1","K2","K3","K4"],"quarters-standAlone-wide":["1. kvartal","2. kvartal","3. kvartal","4. kvartal"],"dateFormatItem-Gy":"y G","dateFormatItem-M":"L.","days-standAlone-wide":["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"],"dayPeriods-format-abbr-noon":"noon","timeFormat-medium":"HH.mm.ss","field-sun-relative+0":"søndag denne uken","dateFormatItem-Hm":"HH.mm","field-sun-relative+1":"søndag neste uke","quarters-standAlone-abbr":["K1","K2","K3","K4"],eraAbbr:["f.Kr.","e.Kr."],"field-minute":"Minutt","field-dayperiod":"AM/PM","days-standAlone-abbr":["sø.","ma.","ti.","on.","to.","fr.","lø."],"dateFormatItem-d":"d.","dateFormatItem-ms":"mm.ss","quarters-format-narrow":["1","2","3","4"],"field-day-relative+-1":"i går","dateTimeFormat-long":"{1} 'kl.' {0}","dayPeriods-format-narrow-am":"a","dateFormatItem-h":"h a","dateFormatItem-MMMd":"d. MMM","dateFormatItem-MEd":"E d.M","dateTimeFormat-full":"{1} {0}","field-fri-relative+0":"fredag denne uken","field-fri-relative+1":"fredag neste uke","field-day":"Dag","days-format-wide":["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"],"field-zone":"Tidssone","months-standAlone-narrow":["J","F","M","A","M","J","J","A","S","O","N","D"],"dateFormatItem-y":"y","dateTimeFormats-appendItem-Day":"{0} ({2}: {1})","field-year-relative+-1":"i fjor","field-month-relative+-1":"forrige måned","dateTimeFormats-appendItem-Year":"{1} {0}","dateFormatItem-hm":"h.mm a","dateTimeFormats-appendItem-Hour":"{0} ({2}: {1})","dayPeriods-format-abbr-pm":"p.m.","days-format-abbr":["søn.","man.","tir.","ons.","tor.","fre.","lør."],eraNames:["f.Kr.","e.Kr."],"dateFormatItem-yMMMd":"d. MMM y","days-format-narrow":["S","M","T","O","T","F","L"],"field-month":"Måned","days-standAlone-narrow":["S","M","T","O","T","F","L"],"dateFormatItem-MMM":"LLL","field-tue-relative+0":"tirsdag denne uken","dateTimeFormats-appendItem-Quarter":"{0} ({2}: {1})","field-tue-relative+1":"tirsdag neste uke","dayPeriods-format-wide-am":"a.m.","dateTimeFormats-appendItem-Month":"{0} ({2}: {1})","dateTimeFormats-appendItem-Minute":"{0} ({2}: {1})","dateFormatItem-EHm":"E HH.mm","field-mon-relative+0":"mandag denne uken","field-mon-relative+1":"mandag neste uke","dateFormat-short":"dd.MM.y","dateFormatItem-EHms":"E HH.mm.ss","dateFormatItem-Ehms":"E h.mm.ss a","dayPeriods-format-narrow-noon":"n","field-second":"Sekund","field-sat-relative+-1":"lørdag sist uke","dateFormatItem-yMMMEd":"E d. MMM y","field-sun-relative+-1":"søndag sist uke","field-month-relative+0":"denne måneden","field-month-relative+1":"neste måned","dateTimeFormats-appendItem-Timezone":"{0} {1}","dateFormatItem-Ed":"E d.","field-week":"Uke","dateFormat-medium":"d. MMM y","field-week-relative+-1":"forrige uke","field-year-relative+0":"i år","field-year-relative+1":"neste år","dayPeriods-format-narrow-pm":"p","dateTimeFormat-short":"{1}, {0}","dateFormatItem-Hms":"HH.mm.ss","dateFormatItem-hms":"h.mm.ss a","dateFormatItem-GyMMM":"MMM y G","field-mon-relative+-1":"mandag sist uke","field-week-relative+0":"denne uken","field-week-relative+1":"neste uke","dateFormatItem-yMM":"MM.y","dateFormatItem-MMdd":"d.M.","field-day-relative+2":"i overmorgen","field-day-relative+-2":"i forgårs","dateFormatItem-yMMMM":"MMMM y",_localized:{}},"esri/layers/vectorTiles/nls/common":{_localized:{}}});