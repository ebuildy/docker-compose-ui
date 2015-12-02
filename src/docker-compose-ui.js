var YAML    = require('yamljs'),
    jade    = require('jade'),
    fs      = require('fs');

var ArgumentParser = require('argparse').ArgumentParser;
var cli = new ArgumentParser({
    prog:           "docker-compose-ui",
    version:        require('../package.json').version,
    addHelp:        true
});

cli.addArgument(['file'], {
    help:   'docker-compose YML file.'
});

try
{
    var options = cli.parseArgs();

    function runCommand(file, jadeTemplate, targetHTML)
    {
        YAML.load(file, function(dockerCompose)
        {
            var serviceReferrers = {};

            for(var serviceName in dockerCompose)
            {
                serviceReferrers[serviceName] = [];
            }

            for(var serviceName in dockerCompose)
            {
                var service = dockerCompose[serviceName];

                if (service.hasOwnProperty('ports'))
                {
                    for(var i = 0; i < service.ports.length; i++)
                    {
                        service.ports[i] = service.ports[i].split(':');
                    }
                }

                if (service.hasOwnProperty('volumes'))
                {
                    for(var i = 0; i < service.volumes.length; i++)
                    {
                        service.volumes[i] = service.volumes[i].split(':');
                    }
                }

                if (service.hasOwnProperty('links'))
                {
                    for(var i = 0; i < service.links.length; i++)
                    {
                        service.links[i] = service.links[i].split(':');
                    }
                }

                if (service.hasOwnProperty('links'))
                {
                    service.links.forEach(function(link)
                    {
                        (serviceReferrers[link[0]]).push(serviceName);
                    });
                }

                service.referrers = serviceReferrers[serviceName];
            }

            var html = jade.renderFile(jadeTemplate, {
                page_title : 'docker-compose UI',
                docker_compose : dockerCompose
            });

            fs.writeFile(targetHTML, html, function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            });


        });
    }

    runCommand(options.file, './src/template.jade', './toto.html');
}
catch (e)
{
    process.stderr.write((e.message ? e.message : e)+"\n");
}