Imports System.Xml
Imports System.Xml.Xsl
Imports System.Xml.Serialization
Imports iTextSharp.text
Imports iTextSharp.text.html.simpleparser
Imports iTextSharp.text.pdf
Imports iTextSharp.text.html
Imports System.Text
Imports System.Net
Imports System.IO
Imports Newtonsoft.Json
Imports Newtonsoft.Json.Linq
Imports System.Web.Services
Imports System.Drawing.Imaging
Imports Svg

Partial Class cma_report
    Inherits System.Web.UI.Page

    dim note1 as string = "The default indicators in the table are based on EPA-related issues, stakeholder feedback, and available data."
    dim note2 as string = "There may be other important issues that are not currently included in this table."
    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
	

    End Sub

    

    Protected Sub pdfBut_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles pdfBut.Click
        Try
           
            Dim arialuniTff As String = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "arial.ttf")
            iTextSharp.text.FontFactory.Register(arialuniTff)

            Dim cjstr As String = cjsonstr.Value
            Dim cjo As JObject = JObject.Parse(cjstr)
            dim headstr as string = headerjson.value
            dim headerobj = JObject.Parse(headstr)
            dim legendstr as String = commonLegend.value
            dim legendobj = JObject.Parse(legendstr)
            dim tractstr as string = headerobj("tract").ToString
            Dim doc As Document = New Document()
            Dim output As MemoryStream = New MemoryStream()
            'Dim output As Stream = New FileStream(Server.MapPath("MyFirstPDF.pdf"), FileMode.Create)
            Dim writer As PdfWriter = PdfWriter.GetInstance(doc, output)
            writer.PageEvent = new PDFFooter()
            doc.Open()
            dim bannername as string = System.Web.HttpContext.Current.Server.MapPath("images/header.png")
            Dim bannerimg As Image = Image.GetInstance(bannername)
            bannerimg.ScaleToFit(524F, 120F)
            bannerimg.Alignment = 1
            doc.Add(bannerimg)
            Dim titlefont As Font = FontFactory.GetFont("Arial", 14, Font.BOLD)
            dim titlestr as String = "Community Data Table for Census " & tractstr
            Dim pg As Paragraph = New Paragraph(titlestr, titlefont)
            pg.Alignment = 1
            doc.Add(pg)
            
            Dim prjfont As Font = FontFactory.GetFont("Arial", 11, Font.BOLD)
            Dim mapimg As String = mapimage.Value
            If mapimg.Length > 0 Then
                If (CheckURL(mapimg)) Then
                    Dim imgfile As Image = Image.GetInstance(New Uri(mapimg))
                    'imgfile.ScalePercent(87.0F)
                    'imgfile.ScaleAbsolute(300f,200f)
                    imgfile.ScaleToFit(524.0F, 300.0F)
                    imgfile.Alignment = 1
                    doc.Add(imgfile)
                Else
                    Dim msgstring As String = "Map image expired. Please refresh the html report page and then click 'Save PDF' button."
                    Dim msgpg As Paragraph = New Paragraph(msgstring, prjfont)
                    doc.Add(msgpg)
                End If
            End If

            Dim legendfont As Font = FontFactory.GetFont("Arial", 8, Font.NORMAL)
            Dim legendTbl As PdfPTable = New PdfPTable(1)
            legendTbl.HorizontalAlignment = Element.ALIGN_CENTER
            Dim p As Paragraph = new Paragraph()
            For Each lelm in legendobj
                    dim ktext as string = lelm.Key.ToString
                    dim sobj = legendobj(ktext)
                    dim colorhex as string = sobj("color").ToString
                    dim lgndesc as string = sobj("label").ToString
                    dim legendData as String = "<svg overflow=""hidden"" width=""16"" height=""16"" style=""touch-action: none;""><defs></defs>"
                    legendData = legendData & "<rect fill=""" & colorhex & """ fill-opacity=""1"" stroke=""rgb(255, 255, 255)"" stroke-opacity=""1"""
                    legendData = legendData & " stroke-width=""1"" stroke-linecap=""butt"" stroke-linejoin=""miter"" stroke-miterlimit=""4"" x=""2"" y=""2"" width=""14"" height=""14"" ry=""0"" rx=""0"" fill-rule=""evenodd"" stroke-dasharray=""none"" dojoGfxStrokeStyle=""solid""></rect>"
                    legendData = legendData & "</svg>"
                    Dim xDocLegend As New System.Xml.XmlDocument
                    xDocLegend.LoadXml(legendData)
                    Dim svgDocLegend As SvgDocument = SvgDocument.Open(xDocLegend)
                    Dim exportStreamLegend As MemoryStream = New MemoryStream()
                    svgDocLegend.Draw().Save(exportStreamLegend, ImageFormat.Png)
                    Dim imgfileLegend As iTextSharp.text.Image = iTextSharp.text.Image.GetInstance(exportStreamLegend.ToArray)
                    imgfileLegend.ScalePercent(50.0F)
                    p.Add(New Chunk(imgfileLegend, 0, 0))
                    p.Add(New Phrase(lgndesc, legendfont))
                    p.Add("  ")
             Next
            
            Dim lgcell As PdfPCell = New PdfPCell()
            lgcell.HorizontalAlignment = Element.ALIGN_CENTER
            lgcell.Border = 0
            lgcell.addElement(p)
            legendTbl.AddCell(lgcell)

            Dim answerfont As Font = FontFactory.GetFont("Arial", 9, Font.NORMAL)
            Dim questionfont As Font = FontFactory.GetFont("Arial", 8, Font.NORMAL)
            'Dim categoryfont As Font = FontFactory.GetFont("Arial", 9, Font.BOLD, New iTextSharp.text.BaseColor(0, 51, 102))
            Dim categoryfont As Font = FontFactory.GetFont("Verdana", 9, Font.BOLD)
            
            'add note
            Dim noteTbl As PdfPTable = New PdfPTable(1)
            noteTbl.TotalWidth = doc.PageSize.Width
            noteTbl.HorizontalAlignment = Element.ALIGN_CENTER
            Dim notefont As Font = FontFactory.GetFont("HELVETICA", 8, Font.NORMAL)
            Dim ncell As PdfPCell = New PdfPCell(New Phrase(note1, notefont))
            ncell.HorizontalAlignment = Element.ALIGN_CENTER
            ncell.Border = 0
            noteTbl.AddCell(ncell)
            Dim ncell2 As PdfPCell = New PdfPCell(New Phrase(note2, notefont))
            ncell2.HorizontalAlignment = Element.ALIGN_CENTER
            ncell2.Border = 0
            noteTbl.AddCell(ncell2)
            doc.Add(noteTbl)
            
            dim notestyle = New StyleSheet()
            notestyle.LoadTagStyle(HtmlTags.BODY, HtmlTags.FACE, "Verdana")    
            notestyle.LoadTagStyle(HtmlTags.BODY, HtmlTags.size, 1)
            notestyle.LoadTagStyle(HtmlTags.sup, "size", "7pt")
            notestyle.LoadTagStyle("a", "color","#337ab7")

            dim ocount as Integer = cjo.Count
            dim i as Integer = 0
            For Each obj In cjo
                dim eachtheme  As JToken = obj.value
                dim theme as string = obj.key.ToString
                dim themedesc = eachtheme("description")
                Dim prjpg As Paragraph = New Paragraph(themedesc, prjfont)
                prjpg.Alignment = 1
                doc.Add(prjpg)
                Dim table As PdfPTable = New PdfPTable(4)
                'table.DefaultCell.BorderWidth = 1
                'table.DefaultCell.BorderColor = BaseColor.YELLOW
  
                table.WidthPercentage = 100

                'table.DefaultCell.Border = 0
                table.SpacingBefore = 10
                table.SpacingAfter = 2
                table.SetWidths(New Integer() {3, 1, 1,1})
                For Each h in headerobj
                    dim headtext as string = h.Value.ToString
                    dim hcell as PdfPCell = New PdfPCell(New Phrase(headtext, categoryfont))
                    if (h.Key.ToString = "desc") then
                        hcell.HorizontalAlignment = Element.ALIGN_LEFT
                    Else
                        hcell.HorizontalAlignment = Element.ALIGN_CENTER
                    End if
                    table.AddCell(hcell)
                Next
                dim style = New StyleSheet()

                style.LoadTagStyle(HtmlTags.BODY, HtmlTags.FACE, "Arial")    
                style.LoadTagStyle(HtmlTags.BODY, HtmlTags.size, 1)                            
                style.LoadTagStyle(HtmlTags.BODY, HtmlTags.ENCODING, BaseFont.IDENTITY_H)
                'style.LoadTagStyle(HtmlTags.sup, HtmlTags.size, 1) 
                
                If Not isNothing(eachtheme("subsets")) then
                    dim subsets = eachtheme.item("subsets")
                    For Each subset As JProperty In subsets
                        dim subobj As JToken = subset.value
                        dim atext as string = subobj("surfix").ToString

                        dim fldobj = subobj.item("fields")
                        for each fld as JProperty in fldobj
                            dim fobj As JToken = fld.value
                            dim hdesc as string = fobj("description").ToString
                            dim tvalue as string = fobj("tract").ToString
                            dim cvalue as string = fobj("county").ToString
                            dim svalue as string = fobj("state").ToString
                            Dim dcell As PdfPCell = New PdfPCell()
                            if (fobj("cumulate")) then
                                
                                dim subdesc as string = hdesc & " " & atext
                                
                                Dim dReader As TextReader = New StringReader(subdesc)            
                                
                                Dim dlist As List(Of IElement) = HTMLWorker.ParseToList(dReader, style)
                                For Each elm As IElement In dlist
                                    dcell.AddElement(elm)
                                Next
                                
                            else
                                
                                dim qtext as String = "Outdoor Air - " & hdesc
                                dcell.PaddingLeft = 10.0F
                                
                                qtext = qtext & " " & atext
                                
                                Dim sReader As TextReader = New StringReader(qtext)            
                                
                                Dim list As List(Of IElement) = HTMLWorker.ParseToList(sReader, style)
                                For Each elm As IElement In list
                                    dcell.AddElement(elm)
                                Next
                            
                            end if
                            table.AddCell(dcell)
                            Dim trcell As PdfPCell = New PdfPCell(New Phrase(tvalue, questionfont))
                            trcell.HorizontalAlignment = Element.ALIGN_RIGHT
                            table.AddCell(trcell)
                            
                            Dim cncell As PdfPCell = New PdfPCell(New Phrase(cvalue, questionfont))
                            cncell.HorizontalAlignment = Element.ALIGN_RIGHT
                            table.AddCell(cncell)
                            
                            Dim stcell As PdfPCell = New PdfPCell(New Phrase(svalue, questionfont))
                            stcell.HorizontalAlignment = Element.ALIGN_RIGHT
                            table.AddCell(stcell)        
                          
                        Next
                        
                    Next
                    doc.Add(table)
                    dim notestr as string = eachtheme("note")
                    if (len(notestr) > 0) then 
                        Dim nReader As TextReader = New StringReader("<p style='line-height: 80%; font-style: italic;'>" & notestr & "</p>")
                        Dim notepg As Paragraph = New Paragraph()
                        'notepg.SpacingBefore = -6
                        notepg.SpacingAfter = 10
                        
                        
                        Dim nlist As List(Of IElement) = HTMLWorker.ParseToList(nReader, notestyle)
                        For Each elm As IElement In nlist
                            notepg.Add(elm)
                        Next
                        'notepg.SetLeading(2, 0.2)
                        doc.Add(notepg)
                    end if
                    addChart(theme,"cancer",doc)
                    addChart(theme,"resp",doc)
                    addChart(theme,"neuro",doc)

                Else
                    dim atext as string = ""
                    dim prefix as String = ""
                    if theme <> "demog" then
                        atext = eachtheme("surfix").ToString
                        prefix = "Outdoor Air - "
                    end if
                    dim cobjarr = eachtheme.item("fields")
                    for each fld as JProperty in cobjarr
                        dim fobj As JToken = fld.value
                        dim hdesc as string = fobj("description").ToString
                        dim tvalue as string = fobj("tract").ToString
                        if tvalue = "" then
                            tvalue = "N/A"
                        end if
                        dim cvalue as string = fobj("county").ToString
                        if cvalue = "" then
                            cvalue = "N/A"
                        end if
                        dim svalue as string = fobj("state").ToString
                        if svalue = "" then
                            svalue = "N/A"
                        end if
                        
                            
                        dim qtext as string = prefix & hdesc
                        'tcell.PaddingLeft = 10.0F
                        if theme = "demog" then
                            Dim tcell As PdfPCell = New PdfPCell(New Phrase(qtext, questionfont))
                            tcell.HorizontalAlignment = Element.ALIGN_LEFT
                            table.AddCell(tcell)
                        else
                            Dim tcell As PdfPCell = New PdfPCell()
                            qtext = "<span style='font-size: 8px;'>" & qtext & " " & atext & "</span>"
                            
                            Dim sReader As TextReader = New StringReader(qtext)            
                            
                            Dim list As List(Of IElement) = HTMLWorker.ParseToList(sReader, style)
                            For Each elm As IElement In list
                                tcell.AddElement(elm)
                            Next
                            table.AddCell(tcell)
                        end if
                        Dim trcell As PdfPCell = New PdfPCell(New Phrase(tvalue, questionfont))
                        trcell.HorizontalAlignment = Element.ALIGN_RIGHT
                        table.AddCell(trcell)
                        
                        Dim cncell As PdfPCell = New PdfPCell(New Phrase(cvalue, questionfont))
                        cncell.HorizontalAlignment = Element.ALIGN_RIGHT
                        table.AddCell(cncell)
                        
                        Dim stcell As PdfPCell = New PdfPCell(New Phrase(svalue, questionfont))
                        stcell.HorizontalAlignment = Element.ALIGN_RIGHT
                        table.AddCell(stcell) 
                    Next
                    doc.Add(table)
                    dim notestr as string = eachtheme("note")
                    if (len(notestr) > 0) then 
                        Dim nReader As TextReader = New StringReader("<p style='line-height: 80%; font-style: italic;'>" & notestr & "</p>")
                        Dim notepg As Paragraph = New Paragraph()
                        'notepg.SpacingBefore = -6
                        notepg.SpacingAfter = 10
                        
                        
                        Dim nlist As List(Of IElement) = HTMLWorker.ParseToList(nReader, notestyle)
                        For Each elm As IElement In nlist
                            notepg.Add(elm)
                        Next
                        'notepg.SetLeading(2, 0.2)
                        doc.Add(notepg)
                    end if
                    addChart(theme,"",doc)
                End If
                
                doc.add(legendTbl)
                'doc.Add(imgfileLegend)
                i = i + 1
                if i < ocount then 
                    doc.NewPage()
                end if
            Next
           
            'add footnote
            dim foothtml as string = <![CDATA[
                <p>
                <a href="https://www.epa.gov/national-air-toxics-assessment/nata-limitations" target="_blank">NATA Limitations</a>
                <br />
                <a href="https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions" target="_blank">NATA Frequent Questions</a>
                <br /><br />
                <div>
                    <sup style="font-size:6px;">1</sup> <a href="https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions#emm10" target="_blank">How does EPA estimate cancer risk?</a> See <a href="https://www.epa.gov/national-air-toxics-assessment/2014-national-air-toxics-assessment" target="_blank">NATA 2014</a> for more details.
                    <br />
                    <sup style="font-size:6px;">2</sup> Hazard Quotient is the ratio of the potential exposure to the substance and the level at which no adverse effects are expected. 
                    <br />Please see <a href="https://www.epa.gov/national-air-toxics-assessment/nata-glossary-terms" target="_blank">NATA: Glossary of Terms</a> for more information.
                </div>
                </p>
            ]]>.Value()
            Dim fReader As TextReader = New StringReader(foothtml)
            dim fstyle = New StyleSheet()
            fstyle.LoadTagStyle("a", "color","#337ab7")
            fstyle.LoadTagStyle("p", "size","7px")
            fstyle.LoadTagStyle("a", "size","7px")
            'fstyle.LoadTagStyle(HtmlTags.sup, "size", "7pt")
            'fstyle.LoadTagStyle("p", "face","Verdana")
            Dim footerTbl As PdfPTable = New PdfPTable(1)
            footerTbl.TotalWidth = doc.PageSize.Width
            footerTbl.HorizontalAlignment = Element.ALIGN_LEFT
            
            Dim flist As List(Of IElement) = HTMLWorker.ParseToList(fReader, fstyle)
            Dim fcell As PdfPCell = New PdfPCell()
            For Each felm As IElement In flist
                fcell.AddElement(felm)
            Next
            
            fcell.Border = 0
            footerTbl.AddCell(fcell)
            doc.Add(footerTbl)
            

            doc.Close()
            Response.ContentType = "application/pdf; charset=iso-8859-1"
            'Response.AddHeader("Content-Disposition", "attachment;filename=myfile.pdf")
            Response.AddHeader("Content-Disposition", "inline;filename=myfile.pdf")
            
            Response.BinaryWrite(output.ToArray())
            Response.End()
        Catch ex As Exception
            Response.Write(ex.ToString)
        End Try

    End Sub
    public sub addChart(ByVal theme as String, ByVal subtheme as String, ByVal doc as Document)
        Dim imageData As String = "<?xml version=""1.0"" encoding=""iso-8859-1""?>"
        Select Case theme
            Case "envcon"
                imageData = imageData & envconChart.Value
            Case "humanexpo"
                imageData = imageData & humanexpoChart.Value
            Case "risk"
                Select Case subtheme
                    case "cancer"
                        imageData = imageData & riskcancerChart.Value
                    case "resp"
                        imageData = imageData & riskrespChart.Value
                    case "neuro"
                        imageData = imageData & riskneuroChart.Value
                End Select
            Case "demog"
                imageData = imageData & demogChart.Value
        End Select
        
        Dim xDoc As New System.Xml.XmlDocument
        xDoc.LoadXml(imageData)
        Dim exportStream As MemoryStream = New MemoryStream()
        Dim svgDoc As SvgDocument = SvgDocument.Open(xDoc)
        svgDoc.Draw().Save(exportStream, ImageFormat.Png)
        Dim svgfile As iTextSharp.text.Image = iTextSharp.text.Image.GetInstance(exportStream.ToArray)
        'svgfile.ScalePercent(80.0F)
        svgfile.ScaleToFit(540.0F, 300.0F)
        svgfile.Alignment = 1
        doc.Add(svgfile)
        'addLegend(doc)
    end sub
    
    public sub addLegend_backup(ByVal doc as Document)
        dim legendData as String = "<svg overflow=""hidden"" width=""18"" height=""18"" style=""touch-action: none;""><defs></defs>"
            legendData = legendData & "<rect fill=""rgb(255, 153, 102)"" fill-opacity=""1"" stroke=""rgb(255, 255, 255)"" stroke-opacity=""1"""
            legendData = legendData & " stroke-width=""1"" stroke-linecap=""butt"" stroke-linejoin=""miter"" stroke-miterlimit=""4"" x=""2"" y=""2"" width=""14"" height=""14"" ry=""0"" rx=""0"" fill-rule=""evenodd"" stroke-dasharray=""none"" dojoGfxStrokeStyle=""solid""></rect>"
            legendData = legendData & "</svg>"

            Dim xDocLegend As New System.Xml.XmlDocument
            xDocLegend.LoadXml(legendData)
            Dim svgDocLegend As SvgDocument = SvgDocument.Open(xDocLegend)
            Dim exportStreamLegend As MemoryStream = New MemoryStream()
            svgDocLegend.Draw().Save(exportStreamLegend, ImageFormat.Png)
            Dim imgfileLegend As iTextSharp.text.Image = iTextSharp.text.Image.GetInstance(exportStreamLegend.ToArray)

            Dim noteTbl As PdfPTable = New PdfPTable(2)
            noteTbl.TotalWidth = doc.PageSize.Width
            noteTbl.HorizontalAlignment = Element.ALIGN_CENTER
            
            Dim ncell As PdfPCell = New PdfPCell()
            ncell.HorizontalAlignment = Element.ALIGN_CENTER
            ncell.Border = 0
            ncell.addElement(New Chunk(imgfileLegend, 5, -5))
            noteTbl.AddCell(ncell)
            Dim ncell2 As PdfPCell = New PdfPCell(New Phrase("test"))
            ncell2.HorizontalAlignment = Element.ALIGN_CENTER
            ncell2.Border = 0
            noteTbl.AddCell(ncell2)
            doc.Add(noteTbl)
    end Sub
    public sub addLegend(ByVal doc as Document)
            dim legendhtml as string = commonLegend.value
            Dim fReader As TextReader = New StringReader(legendhtml)
            dim fstyle = New StyleSheet()
            
            
            Dim legendTbl As PdfPTable = New PdfPTable(1)
            legendTbl.TotalWidth = doc.PageSize.Width
            legendTbl.HorizontalAlignment = Element.ALIGN_CENTER
            
            
            Dim flist As List(Of IElement) = HTMLWorker.ParseToList(fReader, fstyle)
            Dim fcell As PdfPCell = New PdfPCell()
            fcell.HorizontalAlignment = Element.ALIGN_CENTER
            fcell.VerticalAlignment = Element.ALIGN_MIDDLE
            fcell.Border = Rectangle.NO_BORDER
            For Each felm As IElement In flist
                fcell.AddElement(felm)
            Next
            legendTbl.AddCell(fcell)
            doc.add(legendTbl)
 
    end sub
    Public Function CheckURL(ByVal HostAddress As String) As Boolean
        Dim rtCheckURL As Boolean = False
        Try
            Dim req As WebRequest = WebRequest.Create(HostAddress)
            req.Credentials = CredentialCache.DefaultCredentials
            Dim wResponse As WebResponse = req.GetResponse()
            Dim mtype As String = wResponse.ContentType
            If mtype.IndexOf("image") > -1 Then
                rtCheckURL = True
            End If
            wResponse.Close()

        Catch ex As Exception

            rtCheckURL = False

        End Try

        Return rtCheckURL
    End Function

Private Class PDFFooter
    Inherits PdfPageEventHelper

    Public Overrides Sub OnOpenDocument(ByVal writer As PdfWriter, ByVal document As Document)
        MyBase.OnOpenDocument(writer, document)
        
    End Sub

    Public Overrides Sub OnStartPage(ByVal writer As PdfWriter, ByVal document As Document)
        MyBase.OnStartPage(writer, document)
    End Sub

    Public Overrides Sub OnEndPage(ByVal writer As PdfWriter, ByVal document As Document)
        MyBase.OnEndPage(writer, document)
        Dim FontColour As BaseColor = New BaseColor(153, 153, 153)
        Dim Calibri6 As Font = FontFactory.GetFont("Calibri", 7, FontColour)
        Dim footText As String = "Created on: " & Now

        Dim tabFot As New PdfPTable(1)
        Dim cell As New PdfPCell(New Phrase(footText, Calibri6))
        tabFot.TotalWidth = 300F
        cell.HorizontalAlignment = 1
        cell.Border = Rectangle.NO_BORDER
        
        tabFot.AddCell(cell)
        tabFot.WriteSelectedRows(0, -1, 150, document.Bottom, writer.DirectContent)
    End Sub

    Public Overrides Sub OnCloseDocument(ByVal writer As PdfWriter, ByVal document As Document)
        MyBase.OnCloseDocument(writer, document)
    End Sub
End Class
End Class

