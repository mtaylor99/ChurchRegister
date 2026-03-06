$xmlPath = "C:\GitHub\ChurchRegister\ChurchRegister.Tests\TestResults\e80f72db-3d27-4d23-b97f-3bdee5872c1e\coverage.cobertura.xml"
$xml = [xml](Get-Content $xmlPath)
$results = New-Object System.Collections.Generic.List[PSObject]
foreach ($pkg in $xml.coverage.packages.package) {
    foreach ($cls in $pkg.classes.class) {
        $linesValid = [int]$cls.'lines-valid'
        $linesCovered = [int]$cls.'lines-covered'
        $uncovered = $linesValid - $linesCovered
        if ($uncovered -gt 15) {
            $results.Add([PSCustomObject]@{
                File = $cls.filename.Split('\')[-1]
                Uncovered = $uncovered
                Valid = $linesValid
                Rate = [math]::Round([double]$cls.'line-rate'*100,1)
            })
        }
    }
}
$results | Sort-Object Uncovered -Descending | Select-Object -First 35 | Format-Table -AutoSize
