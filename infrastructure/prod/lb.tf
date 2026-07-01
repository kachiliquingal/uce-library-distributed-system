# ==============================================================================
# Production Environment - Application Load Balancer
# ==============================================================================

# ------------------------------------------------------------------------------
# ALB
# ------------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.environment}-uce-library-alb"
  internal           = true
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

resource "aws_lb_target_group" "user_tg" {
  name     = "${var.environment}-user-tg"
  port     = 3003
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "3003"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-user-tg"
    Environment = upper(var.environment)
  }
}

resource "aws_lb_target_group" "loan_tg" {
  name     = "${var.environment}-loan-tg"
  port     = 3004
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "3004"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-loan-tg"
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

# Route /api/users/* → User Service Target Group
resource "aws_lb_listener_rule" "user_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.user_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/users/*"]
    }
  }
}

# Route /api/loan/* → Loan Service Target Group
resource "aws_lb_listener_rule" "loan_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 400

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.loan_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/loans/*"]
    }
  }
}

resource "aws_lb_target_group" "search_tg" {
  name     = "${var.environment}-search-tg"
  port     = 3007
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "3007"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.environment}-search-tg"
    Environment = upper(var.environment)
  }
}

resource "aws_lb_listener_rule" "search_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 600

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.search_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/search/*"]
    }
  }
}
