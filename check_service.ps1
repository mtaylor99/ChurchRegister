$f = "C:\GitHub\ChurchRegister\ChurchRegister.Tests\TestResults\a0e7e196-4495-4b15-8ec5-abe41caae405\coverage.cobertura.xml"
$xml = [xml](Get-Content $f)
foreach ($pkg in $xml.coverage.packages.package) {
    foreach ($cls in $pkg.classes.class) {
        $fname = $cls.filename
        if ($fname -match 'RiskAssessmentService') {
            $lines = $cls.lines.line
            $valid = if ($null -eq $lines) { 0 } else { $lines.Count }
            $covered = if ($null -eq $lines) { 0 } else { ($lines | Where-Object { $_.hits -ne '0' }).Count }
            Write-Host "Class:" $cls.name "File:" $fname "Valid:" $valid "Covered:" $covered "Rate:" $cls.'line-rate'
        }
    }
}
