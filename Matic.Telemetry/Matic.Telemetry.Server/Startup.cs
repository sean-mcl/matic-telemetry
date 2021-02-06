using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MQTTnet.AspNetCore;
using MQTTnet.AspNetCore.Extensions;

namespace Matic.Telemetry.Server
{
    /// <summary>
    ///     StartUp Class
    /// </summary>
    public class Startup
    {
        /// <summary>
        ///     This method gets called by the runtime. Use this method to add services to the container.
        ///     For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        /// </summary>
        /// <param name="services">IServiceCollection</param>
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<MqttService>()
                .AddHostedMqttServerWithServices(options =>
                {
                    var s = options.ServiceProvider.GetRequiredService<MqttService>();
                    s.ConfigureMqttServerOptions(options);
                })
                .AddConnections()
                .AddMqttWebSocketServerAdapter()
                .AddMqttConnectionHandler();
        }

        /// <summary>
        ///     This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        /// </summary>
        /// <param name="app">IApplicationBuilder</param>
        /// <param name="env">IWebHostEnvironment</param>
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseRouting()
                .UseEndpoints(endpoints =>
                {
                    endpoints.MapMqtt("/mqtt");
                })
                .UseMqttServer(server => app.ApplicationServices.GetRequiredService<MqttService>().ConfigureMqttServer(server));
        }
    }
}