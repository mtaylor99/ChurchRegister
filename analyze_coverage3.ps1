$f = "C:\GitHub\ChurchRegister\ChurchRegister.Tests\TestResults\a0e7e196-4495-4b15-8ec5-abe41caae405\coverage.cobertura.xml"
$xml = [xml](Get-Content $f)
Write-Host "Overall:" $xml.coverage.'line-rate' "covered:" $xml.coverage.'lines-covered' "valid:" $xml.coverage.'lines-valid'
$out = [System.Collections.Generic.List[PSObject]]::new()
foreach ($pkg in $xml.coverage.packages.package) {
    foreach ($cls in $pkg.classes.class) {
        $fname = $cls.filename
        if ($fname -match '\\obj\\' -or $fname -match 'RegexGenerator') { continue }
        $lines = $cls.lines.line
        if ($null -eq $lines) { continue }
        $valid = $lines.Count
        $covered = ($lines | Where-Object { $_.hits -ne '0' }).Count
        $uncovered = $valid - $covered
        if ($uncovered -gt 15) {
            $out.Add([PSCustomObject]@{
                File = $fname.Split('\')[-1]
                Uncovered = $uncovered
                Valid = $valid
                Pct = [math]::Round($covered*100/$valid, 0)
            })
        }
    }
}
$out | Sort-Object Uncovered -Descending | Select-Object -First 40 | Format-Table -AutoSize | Out-File -FilePath "C:\GitHub\ChurchRegister\coverage_gaps2.txt" -Encoding UTF8
Write-Host "Done"
