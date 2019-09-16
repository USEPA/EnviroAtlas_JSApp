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

Partial Class cma_hucreport
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
            dim titlehead as string = titlestr.value

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
            Dim pg As Paragraph = New Paragraph(titlehead, titlefont)
            pg.Alignment = 1
            doc.Add(pg)
            
           Dim prjfont As Font = FontFactory.GetFont("Arial", 11, Font.BOLD)
            Dim mapimg As String = mapimage.Value
            If mapimg.Length > 0 Then
                If (CheckURL(mapimg)) Then
                    Dim imgfile As Image = Image.GetInstance(New Uri(mapimg))
                    'imgfile.ScalePercent(50.0F)
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

            Dim answerfont As Font = FontFactory.GetFont("Arial", 9, Font.NORMAL)
            Dim questionfont As Font = FontFactory.GetFont("Arial", 8, Font.NORMAL)
            'Dim categoryfont As Font = FontFactory.GetFont("Arial", 9, Font.BOLD, New iTextSharp.text.BaseColor(0, 51, 102))
            Dim categoryfont As Font = FontFactory.GetFont("Verdana", 9, Font.BOLD)
                Dim table As PdfPTable = New PdfPTable(4)
                'table.DefaultCell.BorderWidth = 1
                'table.DefaultCell.BorderColor = BaseColor.YELLOW
  
                table.WidthPercentage = 100

                'table.DefaultCell.Border = 0
                table.SpacingBefore = 10
                table.SpacingAfter = -2
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

                    
                for each fld in cjo
                    dim fobj As JToken = fld.value
                    dim hdesc as string = fobj("description").ToString
                    dim tvalue as string = fobj("huc12").ToString
                    dim cvalue as string = fobj("county").ToString
                    dim svalue as string = fobj("state").ToString
                    
                        
                    dim qtext as string = hdesc

                        Dim tcell As PdfPCell = New PdfPCell(New Phrase(qtext, questionfont))
                        
                        table.AddCell(tcell)

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
                dim nstr as string = notestr.value
                Dim ng As Paragraph = New Paragraph(nstr, questionfont)
                    
            'pg.Alignment = 1
            doc.Add(ng)
            doc.add(new Paragraph(" "))
            addChart(doc)
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
    public sub addChart(ByVal doc as Document)
        Dim imageData As String = "<?xml version=""1.0"" encoding=""iso-8859-1""?>"
        imageData = imageData & chartsvg.Value

        
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
        
        dim legendstr as String = legendsvg.value
        dim legendobj = JObject.Parse(legendstr)
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
        doc.Add(legendTbl)
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

