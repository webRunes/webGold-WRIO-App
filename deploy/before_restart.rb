Chef::Log.info('Performing pre-deploy steps..')

bash 'before_deploy' do
  cwd '/srv/www/webgold/current'
  user 'root'
  code <<-EOF
    npm install -g gulp
  EOF
end


bash 'after_deploy' do
  cwd '/srv/www/webgold/current'
  user 'deploy'
  code <<-EOF
    gulp
  EOF
end
