# ==============================================================================
# Production Environment - Application Load Balancer
# ==============================================================================

# ------------------------------------------------------------------------------
# ALB
# ------------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.environment}-uce-library-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.default.ids

  tags = {
    Name        = "${var.environment}-uce-library-alb"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Target Groups
# ------------------------------------------------------------------------------
resource "aws_lb_target_group" "auth_tg" {
  name     = "${var.environment}-auth-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "3001"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-auth-tg"
    Environment = upper(var.environment)
  }
}

resource "aws_lb_target_group" "catalog_tg" {
  name     = "${var.environment}-catalog-tg"
  port     = 3002
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "3002"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-catalog-tg"
    Environment = upper(var.environment)
  }
}

resource "aws_lb_target_group" "frontend_tg" {
  name     = "${var.environment}-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/"
    port                = "80"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-frontend-tg"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# ALB Listener (Port 80) + Routing Rules
# ------------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Default action: Forward to Frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# Route /api/auth/* → Auth Service Target Group
resource "aws_lb_listener_rule" "auth_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/auth/*"]
    }
  }
}

# Route /api/catalog/* → Catalog Service Target Group
resource "aws_lb_listener_rule" "catalog_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.catalog_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/catalog/*"]
    }
  }
}
