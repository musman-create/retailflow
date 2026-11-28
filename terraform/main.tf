resource "aws_instance" "retailflow" {
  ami                         = "ami-0fef201115eefe936"
  instance_type               = "m7i-flex.large"
  key_name                    = "sanni"
  subnet_id                   = "subnet-000b5b0c7a6b30095"
  associate_public_ip_address = true

  iam_instance_profile = "RetailFlowEC2BackupRole"

  vpc_security_group_ids = [
    "sg-07aef85dd4e7d8900"
  ]

  monitoring                           = false
  ebs_optimized                        = true
  source_dest_check                    = true
  disable_api_stop                     = false
  disable_api_termination              = false
  instance_initiated_shutdown_behavior = "stop"

  cpu_options {
    core_count       = 1
    threads_per_core = 2
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    http_protocol_ipv6          = "disabled"
    instance_metadata_tags      = "disabled"
  }

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = false
    delete_on_termination = true
  }

  tags = {
    Name = "mavin-server"
  }

  lifecycle {
    prevent_destroy = true
  }
}
