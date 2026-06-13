# UCE Library — AWS Strategy

> CRITICAL FOR ANY AI AGENT READING THIS:
> - 9 AWS Academy accounts total
> - 4 accounts are active (2 for QA, 2 for PROD)
> - 5 accounts are reserve
> - Max 9 EC2 instances per account
> - Rule: 1 microservice per EC2 instance — no exceptions
> - Do NOT suggest putting 2 services on one instance

---

## Why 4 accounts instead of 2

Using 1 account per environment would require fitting 10 MS + gateway + frontend +
brokers + monitoring into 9 instances. That forces sharing, which breaks fault isolation.

With 2 accounts per environment:
- Account A handles core MS (auth, catalog, loan, user) + gateway + frontend + brokers + monitoring
- Account B handles secondary MS (fine, report, notification, reservation, search, inventory)
- Each account uses 7–8 of its 9 slots, leaving 1–2 as genuine reserve
- Total budget: 4 × $50 = $200 per environment cycle

---

## QA Account A — Core services

| # | Instance name | Runs | DB | Type |
|---|--------------|------|----|------|
| 1 | ec2-auth | auth-service (MS-01) | PostgreSQL + Redis | t2.small |
| 2 | ec2-catalog | catalog-service (MS-02) | MongoDB | t2.micro |
| 3 | ec2-loan | loan-service (MS-03) | MySQL | t2.small |
| 4 | ec2-user | user-service (MS-05) | Neo4j | t2.small |
| 5 | ec2-gateway | API Gateway (Nginx) | — | t2.micro |
| 6 | ec2-frontend | Frontend (React/Vite) | — | t2.micro |
| 7 | ec2-infra | Kafka + RabbitMQ + MQTT (Mosquitto) + n8n | — | t2.small |
| 8 | ec2-monitoring | Prometheus + Grafana | — | t2.small |
| 9 | *(reserve)* | Available | — | — |

## QA Account B — Secondary services

| # | Instance name | Runs | DB | Type |
|---|--------------|------|----|------|
| 1 | ec2-fine | fine-service (MS-06) | Elasticsearch | t2.medium |
| 2 | ec2-report | report-service (MS-07) | InfluxDB | t2.small |
| 3 | ec2-notification | notification-service (MS-04) | Cassandra | t2.small |
| 4 | ec2-reservation | reservation-service (MS-08) | — (DynamoDB managed) | t2.micro |
| 5 | ec2-search | search-service (MS-10) | — (ES on ec2-fine) | t2.micro |
| 6 | ec2-inventory | inventory-service (MS-09) | CouchDB | t2.micro |
| 7–9 | *(reserve)* | — | — | — |

> Note: search-service connects to the Elasticsearch cluster on ec2-fine via internal IP.
> They share the same ES cluster but use separate indices: `fines` and `books`.
> Note: ec2-fine uses t2.medium because Elasticsearch requires minimum 1 GB JVM heap.
>       Running it on t2.micro causes OOM crashes — do not downgrade.

## PROD Account A and PROD Account B

Mirror of QA A and QA B exactly, with these PROD-only additions:

```
Application Load Balancer (ALB)
  └── Target Group → Auto Scaling Group
        ├── min: 1 instance
        ├── max: 3 instances
        └── spans: us-east-1a + us-east-1b (Multi-AZ mandatory)

Aurora MySQL cluster (loan-service only)
  ├── Writer endpoint → loan-service write commands
  └── Reader endpoint → loan-service read queries (CQRS)
```

ELB and ASG are PROD-only. Do NOT create them in QA. The QA environment uses
Watchtower for rolling deployments instead.

---

## EBS Volumes — Persistent Database Storage

Every instance running a database has an EBS gp2 volume attached.
Mount point: `/mnt/ebs` on the EC2 instance.
Docker Compose binds all DB container volumes to subdirectories of `/mnt/ebs`.

Effect: terminating or replacing an EC2 instance does NOT delete database data.
The EBS volume is independent and reattaches to the new instance.

### EBS directory layout per instance

```
ec2-auth        /mnt/ebs/postgres/    /mnt/ebs/redis/
ec2-catalog     /mnt/ebs/mongo/
ec2-loan        /mnt/ebs/mysql/
ec2-user        /mnt/ebs/neo4j/
ec2-fine        /mnt/ebs/elasticsearch/
ec2-report      /mnt/ebs/influxdb/
ec2-notification /mnt/ebs/cassandra/
ec2-inventory   /mnt/ebs/couchdb/
```

### Terraform snippet — EBS attachment

```hcl
resource "aws_ebs_volume" "auth_data" {
  availability_zone = "us-east-1a"
  size              = 20
  type              = "gp2"
  tags = { Name = "uce-auth-data-qa" }
}

resource "aws_volume_attachment" "auth_data_attach" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.auth_data.id
  instance_id = aws_instance.ec2_auth.id
}
```

### EC2 user_data — mount the EBS volume

```bash
#!/bin/bash
# Run once on first boot — format and mount EBS
if ! blkid /dev/xvdf; then
  mkfs -t ext4 /dev/xvdf
fi
mkdir -p /mnt/ebs
mount /dev/xvdf /mnt/ebs
echo "/dev/xvdf /mnt/ebs ext4 defaults,nofail 0 2" >> /etc/fstab
# Create subdirectories for each DB on this instance
mkdir -p /mnt/ebs/postgres /mnt/ebs/redis
```

### Docker Compose — bind volume to EBS

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/ebs/postgres
```

---

## Network Architecture

### QA Account A VPC

```
CIDR: 10.0.0.0/16

Public subnet  10.0.1.0/24 → ec2-gateway (Elastic IP), ec2-bastion
Private subnet 10.0.2.0/24 → all other instances (no public IP)

Security groups:
  sg-gateway  → inbound 80/443 from 0.0.0.0/0
  sg-internal → inbound ALL traffic from sg-gateway only
  sg-bastion  → inbound 22 from your IP only
  sg-internal → inbound 22 from sg-bastion only
```

### QA Account B VPC

```
CIDR: 10.1.0.0/16  (different range — no overlap with Account A)

Public subnet  10.1.1.0/24 → ec2-bastion-b (if needed)
Private subnet 10.1.2.0/24 → all MS instances

Security groups:
  sg-internal-b → inbound from Account A VPC CIDR (10.0.0.0/16) via VPC peering
```

> Account A and Account B within the same environment CAN communicate via VPC peering.
> This is necessary for the gateway in Account A to route traffic to MS in Account B.

### QA ↔ PROD Isolation (MANDATORY — spec requirement)

```
QA  VPCs: 10.0.0.0/16 and 10.1.0.0/16
PROD VPCs: 10.2.0.0/16 and 10.3.0.0/16

Zero peering between any QA VPC and any PROD VPC.
Zero shared security groups.
Zero shared databases.
Separate S3 state buckets per account.
```

---

## Instance Sizing Rationale

| Type | Used for | Reason |
|------|---------|--------|
| t2.micro | Gateway, frontend, reservation, search | Lightweight — Nginx, static files, simple Node.js |
| t2.small | Auth, catalog, loan, user, notification, infra, monitoring | Node.js + one DB + moderate traffic |
| t2.medium | Fine service (Elasticsearch) | ES requires ≥1 GB JVM heap — t2.micro OOMs |

---

## Cost Control Rules

1. Stop QA instances after each demo session — t2.micro ~$8/month running 24/7
2. ELB is PROD only — ~$16/month, do not create in QA
3. Release Elastic IPs when not attached to a running instance ($0.005/hr idle)
4. Keep EBS volumes under 20 GB — gp2 at $0.10/GB-month
5. DynamoDB on-demand — near zero cost at low traffic
6. Never downgrade ec2-fine to t2.micro — Elasticsearch will OOM and crash

---

## Forbidden services (AWS Academy student limitations)

- AWS API Gateway → FORBIDDEN. Use custom Nginx gateway on ec2-gateway.
- AWS IAM advanced features → FORBIDDEN.
- Custom Nginx load balancers → FORBIDDEN in PROD. Use AWS ELB instead.
